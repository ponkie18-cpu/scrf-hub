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

    // Get current subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub || (sub.plan_type !== "pro" && sub.plan_type !== "trial")) {
      return json({ success: false, error: "No active subscription to cancel" }, 400);
    }

    // Cancel Paystack subscription if exists
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (paystackSecret && sub.paystack_subscription_code && !sub.paystack_subscription_code.startsWith("manual_")) {
      try {
        await fetch(`https://api.paystack.co/subscription/disable`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: sub.paystack_subscription_code,
            token: sub.paystack_customer_code, // email token
          }),
        });
      } catch (e) {
        console.error("Paystack subscription disable failed:", e);
      }
    }

    // Determine access end date (end of current billing period)
    const accessUntil = sub.subscription_end_date || sub.trial_end_date || new Date().toISOString();

    // Update subscription: cancelled but retain access
    await supabase
      .from("subscriptions")
      .update({
        plan_type: "cancelled",
        subscription_end_date: accessUntil,
      })
      .eq("user_id", user.id);

    // Log billing event
    await supabase.from("billing_events").insert({
      user_id: user.id,
      event_type: "subscription_cancelled",
      event_data: { access_until: accessUntil, reason: "user_initiated" },
    });

    // Notification
    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "subscription",
        title: "Subscription Cancelled",
        message: `Your Pro subscription has been cancelled. You'll keep Pro access until ${new Date(accessUntil).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.`,
        action_url: "/settings",
      });
    } catch (_) { /* non-blocking */ }

    // Send cancellation email via existing edge function
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey && user.email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SCRF Hub <noreply@tsadinaledi.lovable.app>",
            to: user.email,
            subject: "Your SCRF Pro subscription has been cancelled",
            html: `
              <h2>Subscription Cancelled</h2>
              <p>Hi ${user.user_metadata?.name || "there"},</p>
              <p>Your SCRF Pro subscription has been cancelled as requested.</p>
              <p><strong>You'll keep full Pro access until ${new Date(accessUntil).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.</strong></p>
              <p>After that date, you'll move to the Free plan. Your data will be preserved — you just won't be able to access Pro-only tools.</p>
              <p>Changed your mind? You can reactivate anytime from your Settings page.</p>
              <p>— The SCRF Hub Team</p>
            `,
          }),
        });
      }
    } catch (e) {
      console.error("Cancellation email failed:", e);
    }

    return json({
      success: true,
      accessUntil,
    });
  } catch (err) {
    console.error("cancel-subscription error:", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
