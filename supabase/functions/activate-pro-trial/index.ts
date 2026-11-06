import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return json({ success: false, error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already has/had a trial
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sub?.trial_start_date) {
      return json({ success: false, error: "Trial already used. Each account gets one free trial." }, 400);
    }

    // Create Paystack customer
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    let customerCode: string | null = null;

    if (paystackSecret) {
      try {
        const custRes = await fetch("https://api.paystack.co/customer", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            metadata: { user_id: user.id },
          }),
        });
        const custData = await custRes.json();
        if (custData.status) {
          customerCode = custData.data.customer_code;
        }
      } catch (e) {
        console.error("Paystack customer creation failed:", e);
      }
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (sub) {
      // Update existing record
      await supabase
        .from("subscriptions")
        .update({
          plan_type: "trial",
          trial_start_date: now.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          paystack_customer_code: customerCode,
        })
        .eq("user_id", user.id);
    } else {
      // Insert new record
      await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan_type: "trial",
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        paystack_customer_code: customerCode,
      });
    }

    // Keep legacy user_subscriptions in sync
    await supabase
      .from("user_subscriptions")
      .update({
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEnd.toISOString(),
      })
      .eq("user_id", user.id);

    // Log billing event
    await supabase.from("billing_events").insert({
      user_id: user.id,
      event_type: "trial_started",
      event_data: { trial_end_date: trialEnd.toISOString(), customer_code: customerCode },
    });

    const daysRemaining = 14;

    return json({
      success: true,
      trialEndDate: trialEnd.toISOString(),
      daysRemaining,
    });
  } catch (err) {
    console.error("activate-pro-trial error:", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
