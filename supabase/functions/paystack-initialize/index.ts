import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { plan, callback_url } = await req.json();

    // Plan configuration (amounts in kobo — Paystack uses smallest currency unit)
    const plans: Record<string, { amount: number; interval: string; name: string }> = {
      monthly: { amount: 49900, interval: "monthly", name: "SCRF Pro Monthly" },
      annual: { amount: 499900, interval: "annually", name: "SCRF Pro Annual" },
    };

    const selectedPlan = plans[plan] || plans.monthly;

    // Initialize transaction via Paystack API
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reference = `scrf_${user.id.slice(0, 8)}_${Date.now()}`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: selectedPlan.amount,
        reference,
        currency: "ZAR",
        callback_url: callback_url || undefined,
        metadata: {
          user_id: user.id,
          plan: plan || "monthly",
          plan_name: selectedPlan.name,
          custom_fields: [
            { display_name: "Plan", variable_name: "plan", value: selectedPlan.name },
          ],
        },
        channels: ["card", "eft"],
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      console.error("Paystack init failed:", paystackData);
      return new Response(
        JSON.stringify({ success: false, error: paystackData.message || "Payment initialization failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_code: paystackData.data.access_code,
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("paystack-initialize error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
