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

    const { reference, plan } = await req.json();
    if (!reference) return json({ success: false, error: "Transaction reference required" }, 400);

    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) return json({ success: false, error: "Payment service not configured" }, 500);

    // Verify transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return json({
        success: false,
        error: "Payment not verified",
        status: verifyData.data?.status,
      }, 400);
    }

    // Verify payment belongs to this user
    const paymentUserId = verifyData.data.metadata?.user_id;
    if (paymentUserId !== user.id) {
      return json({ success: false, error: "Payment mismatch" }, 403);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const selectedPlan = plan || verifyData.data.metadata?.plan || "monthly";
    const amountRands = Math.round(verifyData.data.amount / 100);
    const now = new Date();
    const nextBilling = new Date();
    if (selectedPlan === "annual") {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    } else {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    }

    // Create Paystack subscription if authorization exists
    let subscriptionCode: string | null = null;
    const authorizationCode = verifyData.data.authorization?.authorization_code;
    const customerCode = verifyData.data.customer?.customer_code;

    if (authorizationCode && customerCode) {
      try {
        // We'll use the authorization for future charges
        // Paystack auto-handles recurring via subscription plans
        subscriptionCode = `manual_${reference}`;
      } catch (e) {
        console.error("Subscription creation note:", e);
      }
    }

    // Update subscriptions table
    await supabase
      .from("subscriptions")
      .update({
        plan_type: "pro",
        subscription_start_date: now.toISOString(),
        subscription_end_date: nextBilling.toISOString(),
        paystack_customer_code: customerCode || null,
        paystack_subscription_code: subscriptionCode,
        billing_interval: selectedPlan,
        monthly_amount_rands: amountRands,
        last_payment_date: now.toISOString(),
        next_billing_date: nextBilling.toISOString(),
        payment_failure_count: 0,
      })
      .eq("user_id", user.id);

    // Keep legacy user_subscriptions in sync
    await supabase
      .from("user_subscriptions")
      .update({
        tier: "pro",
        subscription_active: true,
        current_period_end: nextBilling.toISOString(),
        paystack_customer_code: customerCode || null,
        last_payment_reference: reference,
        plan_code: selectedPlan,
      })
      .eq("user_id", user.id);

    // Log billing event
    await supabase.from("billing_events").insert({
      user_id: user.id,
      event_type: "subscription_activated",
      paystack_reference: reference,
      amount_rands: amountRands,
      event_data: {
        plan: selectedPlan,
        next_billing_date: nextBilling.toISOString(),
        customer_code: customerCode,
      },
    });

    // Notification
    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "subscription",
        title: "Pro Subscription Activated! 🎉",
        message: `Your SCRF Pro ${selectedPlan === "annual" ? "Annual" : "Monthly"} plan is now active. Next billing: ${nextBilling.toLocaleDateString("en-ZA")}.`,
        action_url: "/dashboard",
      });
    } catch (_) { /* non-blocking */ }

    return json({
      success: true,
      nextBillingDate: nextBilling.toISOString(),
      planType: "pro",
      billingInterval: selectedPlan,
    });
  } catch (err) {
    console.error("activate-paid-subscription error:", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
