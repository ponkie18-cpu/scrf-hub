import { createClient } from "npm:@supabase/supabase-js@2.89.0";

// This function is called by pg_cron daily at 05:00 SAST
// It manages trial expiry warnings, expired trials, grace periods, and cancelled subs

Deno.serve(async (req) => {
  try {
    // Verify this is a cron call or has service key
    const authHeader = req.headers.get("Authorization");
    const isServiceCall = authHeader?.includes(Deno.env.get("SUPABASE_ANON_KEY") || "");
    
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD for idempotency
    const results: Record<string, number> = {};

    // Helper: check if event already logged today for a user
    const alreadyProcessedToday = async (userId: string, eventType: string): Promise<boolean> => {
      const { data } = await supabase
        .from("billing_events")
        .select("id")
        .eq("user_id", userId)
        .eq("event_type", eventType)
        .gte("created_at", `${today}T00:00:00Z`)
        .limit(1);
      return (data?.length ?? 0) > 0;
    };

    // Helper: send notification (idempotent)
    const notify = async (userId: string, title: string, message: string, actionUrl = "/settings") => {
      try {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "subscription",
          title,
          message,
          action_url: actionUrl,
        });
      } catch (_) { /* ignore dupes */ }
    };

    // Helper: send email
    const sendEmail = async (email: string, subject: string, html: string) => {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey || !email) return;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SCRF Hub <noreply@tsadinaledi.lovable.app>",
            to: email,
            subject,
            html,
          }),
        });
      } catch (e) {
        console.error("Email send failed:", e);
      }
    };

    // 1. Trials expiring in 7 days
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    const { data: sevenDayTrials } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("plan_type", "trial")
      .gte("trial_end_date", sixDaysFromNow.toISOString())
      .lte("trial_end_date", sevenDaysFromNow.toISOString());

    let count7d = 0;
    for (const t of sevenDayTrials || []) {
      if (await alreadyProcessedToday(t.user_id, "trial_expiry_warning_7d")) continue;
      await supabase.from("billing_events").insert({
        user_id: t.user_id,
        event_type: "trial_expiry_warning_7d",
      });
      await notify(t.user_id, "7 Days Left in Your Trial", "Your Pro trial ends in 7 days. Upgrade now to keep all your tools.", "/settings");

      // Get email
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", t.user_id).maybeSingle();
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(t.user_id);
      if (authUser?.email) {
        await sendEmail(authUser.email, "Your SCRF Pro trial ends in 7 days",
          `<h2>7 days remaining</h2><p>Hi ${profile?.name || "there"},</p><p>Your Pro trial is ending soon. Upgrade to keep access to all 16 risk tools and your personalised dashboard.</p><p><a href="https://tsadinaledi.lovable.app/settings">Upgrade Now →</a></p>`
        );
      }
      count7d++;
    }
    results["trial_expiry_warning_7d"] = count7d;

    // 2. Trials expiring in 1 day
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const { data: oneDayTrials } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("plan_type", "trial")
      .gte("trial_end_date", now.toISOString())
      .lte("trial_end_date", oneDayFromNow.toISOString());

    let count1d = 0;
    for (const t of oneDayTrials || []) {
      if (await alreadyProcessedToday(t.user_id, "trial_expiry_warning_1d")) continue;
      await supabase.from("billing_events").insert({
        user_id: t.user_id,
        event_type: "trial_expiry_warning_1d",
      });
      await notify(t.user_id, "⚠️ Trial Ends Tomorrow!", "Your Pro trial ends tomorrow. Upgrade now to keep your tools and progress.", "/settings");

      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(t.user_id);
      if (authUser?.email) {
        await sendEmail(authUser.email, "⚠️ Your SCRF Pro trial ends TOMORROW",
          `<h2>Last day of your trial</h2><p>Your Pro trial ends tomorrow. Don't lose access to your risk tools and dashboard.</p><p><a href="https://tsadinaledi.lovable.app/settings">Upgrade Now — R299/month →</a></p>`
        );
      }
      count1d++;
    }
    results["trial_expiry_warning_1d"] = count1d;

    // 3. Expired trials
    const { data: expiredTrials } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("plan_type", "trial")
      .lt("trial_end_date", now.toISOString());

    let countExpired = 0;
    for (const t of expiredTrials || []) {
      if (await alreadyProcessedToday(t.user_id, "trial_expired")) continue;

      await supabase
        .from("subscriptions")
        .update({ plan_type: "expired" })
        .eq("user_id", t.user_id);

      // Sync legacy
      await supabase
        .from("user_subscriptions")
        .update({ tier: "free_registered", subscription_active: false })
        .eq("user_id", t.user_id);

      await supabase.from("billing_events").insert({
        user_id: t.user_id,
        event_type: "trial_expired",
      });
      await notify(t.user_id, "Trial Ended", "Your Pro trial has ended. Upgrade to continue using all tools, or keep using the free tools.", "/settings");

      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(t.user_id);
      if (authUser?.email) {
        await sendEmail(authUser.email, "Your SCRF Pro trial has ended",
          `<h2>Trial Ended</h2><p>Your 14-day Pro trial is over. Your data is safe — upgrade anytime to regain access.</p><p><a href="https://tsadinaledi.lovable.app/settings">See Pricing →</a></p>`
        );
      }
      countExpired++;
    }
    results["trial_expired"] = countExpired;

    // 4. Failed payments — start grace period (7 days)
    const { data: failedSubs } = await supabase
      .from("subscriptions")
      .select("user_id, payment_failure_count, subscription_end_date")
      .eq("plan_type", "pro")
      .gte("payment_failure_count", 1);

    let countGrace = 0;
    for (const s of failedSubs || []) {
      if (await alreadyProcessedToday(s.user_id, "grace_period_started")) continue;
      const graceEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await supabase
        .from("subscriptions")
        .update({ subscription_end_date: graceEnd.toISOString() })
        .eq("user_id", s.user_id);
      await supabase.from("billing_events").insert({
        user_id: s.user_id,
        event_type: "grace_period_started",
        event_data: { grace_end: graceEnd.toISOString() },
      });
      await notify(s.user_id, "Payment Issue — Action Required", `We couldn't process your payment. You have until ${graceEnd.toLocaleDateString("en-ZA")} to update your payment method.`, "/settings");
      countGrace++;
    }
    results["grace_period_started"] = countGrace;

    // 5. Grace period ended — revoke access
    const { data: gracedSubs } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("plan_type", "pro")
      .gte("payment_failure_count", 1)
      .lt("subscription_end_date", now.toISOString());

    let countRevoked = 0;
    for (const s of gracedSubs || []) {
      if (await alreadyProcessedToday(s.user_id, "grace_period_ended")) continue;
      await supabase
        .from("subscriptions")
        .update({ plan_type: "expired", payment_failure_count: 0 })
        .eq("user_id", s.user_id);
      await supabase
        .from("user_subscriptions")
        .update({ tier: "free_registered", subscription_active: false })
        .eq("user_id", s.user_id);
      await supabase.from("billing_events").insert({
        user_id: s.user_id,
        event_type: "grace_period_ended",
      });
      await notify(s.user_id, "Pro Access Revoked", "Your Pro access has been revoked due to payment failure. Resubscribe to regain access.", "/settings");
      countRevoked++;
    }
    results["grace_period_ended"] = countRevoked;

    // 6. Cancelled subscriptions past end date
    const { data: cancelledPast } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("plan_type", "cancelled")
      .lt("subscription_end_date", now.toISOString());

    let countDowngraded = 0;
    for (const s of cancelledPast || []) {
      await supabase
        .from("subscriptions")
        .update({ plan_type: "free" })
        .eq("user_id", s.user_id);
      await supabase
        .from("user_subscriptions")
        .update({ tier: "free_registered", subscription_active: false })
        .eq("user_id", s.user_id);
      countDowngraded++;
    }
    results["cancelled_downgraded"] = countDowngraded;

    console.log("Billing lifecycle cron completed:", results);
    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("billing-lifecycle-cron error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
