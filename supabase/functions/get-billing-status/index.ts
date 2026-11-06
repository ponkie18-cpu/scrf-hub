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

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub) {
      return json({
        success: true,
        planType: "free",
        trialDaysRemaining: null,
        nextBillingDate: null,
        paymentFailureCount: 0,
        accessUntil: null,
        canActivateTrial: true,
        billingInterval: null,
        monthlyAmountRands: null,
      });
    }

    const now = new Date();
    let trialDaysRemaining: number | null = null;

    if (sub.plan_type === "trial" && sub.trial_end_date) {
      const diff = new Date(sub.trial_end_date).getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    // Determine effective access end date
    let accessUntil: string | null = null;
    if (sub.plan_type === "pro") {
      accessUntil = sub.subscription_end_date || sub.next_billing_date;
    } else if (sub.plan_type === "trial") {
      accessUntil = sub.trial_end_date;
    } else if (sub.plan_type === "cancelled") {
      accessUntil = sub.subscription_end_date;
    }

    // Can activate trial: only if never had one
    const canActivateTrial = !sub.trial_start_date;

    return json({
      success: true,
      planType: sub.plan_type,
      trialDaysRemaining,
      nextBillingDate: sub.next_billing_date,
      paymentFailureCount: sub.payment_failure_count || 0,
      accessUntil,
      canActivateTrial,
      billingInterval: sub.billing_interval,
      monthlyAmountRands: sub.monthly_amount_rands,
    });
  } catch (err) {
    console.error("get-billing-status error:", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
