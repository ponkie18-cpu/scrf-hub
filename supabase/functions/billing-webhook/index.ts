import { createClient } from "npm:@supabase/supabase-js@2.89.0";
import { createHmac } from "node:crypto";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const webhookSecret = Deno.env.get("PAYSTACK_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("PAYSTACK_WEBHOOK_SECRET not configured");
      return new Response("Server error", { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // CRITICAL: Verify HMAC-SHA512 signature before any processing
    const hash = createHmac("sha512", webhookSecret).update(body).digest("hex");
    if (hash !== signature) {
      console.error("Invalid webhook signature — rejecting");
      return new Response("Invalid signature", { status: 401 });
    }

    // Return 200 immediately to Paystack
    const event = JSON.parse(body);
    console.log("Billing webhook event:", event.event);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Helper to log billing event
    const logEvent = async (
      userId: string,
      eventType: string,
      reference?: string,
      amountRands?: number,
      eventData?: Record<string, unknown>
    ) => {
      try {
        await supabase.from("billing_events").insert({
          user_id: userId,
          event_type: eventType,
          paystack_reference: reference || null,
          amount_rands: amountRands || null,
          event_data: eventData || event.data,
        });
      } catch (e) {
        console.error("Failed to log billing event:", e);
      }
    };

    // Helper to find user by paystack subscription code
    const findUserBySubCode = async (subCode: string) => {
      const { data } = await supabase
        .from("subscriptions")
        .select("user_id, id")
        .eq("paystack_subscription_code", subCode)
        .maybeSingle();
      return data;
    };

    switch (event.event) {
      case "charge.success": {
        const { reference, metadata, customer, amount, currency } = event.data;
        const userId = metadata?.user_id;
        if (!userId) {
          console.error("No user_id in charge.success metadata, ref:", reference);
          break;
        }

        const amountRands = Math.round(amount / 100);
        const plan = metadata?.plan || "monthly";

        // Calculate next billing date
        const nextBilling = new Date();
        if (plan === "annual") {
          nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        } else {
          nextBilling.setMonth(nextBilling.getMonth() + 1);
        }

        // Update subscription to pro
        await supabase
          .from("subscriptions")
          .update({
            plan_type: "pro",
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: nextBilling.toISOString(),
            paystack_customer_code: customer?.customer_code || null,
            billing_interval: plan,
            monthly_amount_rands: amountRands,
            last_payment_date: new Date().toISOString(),
            next_billing_date: nextBilling.toISOString(),
            payment_failure_count: 0,
          })
          .eq("user_id", userId);

        // Also keep legacy user_subscriptions in sync
        await supabase
          .from("user_subscriptions")
          .update({
            tier: "pro",
            subscription_active: true,
            current_period_end: nextBilling.toISOString(),
            paystack_customer_code: customer?.customer_code || null,
            last_payment_reference: reference,
          })
          .eq("user_id", userId);

        // Record payment in payment_history
        try {
          await supabase.from("payment_history").insert({
            user_id: userId,
            amount,
            currency: currency || "ZAR",
            reference,
            paystack_status: "success",
            plan_code: plan,
            metadata: event.data,
          });
        } catch (_) { /* ignore duplicate reference */ }

        await logEvent(userId, "payment_success", reference, amountRands);

        // Send in-app notification
        try {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "subscription",
            title: "Payment Successful! 🎉",
            message: `Your SCRF Pro ${plan === "annual" ? "Annual" : "Monthly"} payment of R${amountRands} was successful.`,
            action_url: "/dashboard",
          });
        } catch (_) { /* non-blocking */ }

        console.log("Payment processed for user:", userId, "R" + amountRands);
        break;
      }

      case "charge.failed": {
        const failedRef = event.data.reference;
        const failedUserId = event.data.metadata?.user_id;
        if (!failedUserId) break;

        // Increment failure count
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("payment_failure_count, id")
          .eq("user_id", failedUserId)
          .maybeSingle();

        if (sub) {
          const newCount = (sub.payment_failure_count || 0) + 1;
          await supabase
            .from("subscriptions")
            .update({ payment_failure_count: newCount })
            .eq("user_id", failedUserId);

          // Record retry
          await supabase.from("billing_failure_retries").insert({
            user_id: failedUserId,
            subscription_id: sub.id,
            attempt_number: newCount,
            failure_reason: event.data.gateway_response || "Payment failed",
            next_retry_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        await logEvent(failedUserId, "payment_failed", failedRef);

        try {
          await supabase.from("notifications").insert({
            user_id: failedUserId,
            type: "payment_warning",
            title: "Payment Failed",
            message: "We couldn't process your subscription payment. Please update your payment method to keep Pro access.",
            action_url: "/settings",
          });
        } catch (_) { /* non-blocking */ }

        break;
      }

      case "subscription.disable": {
        const sub = await findUserBySubCode(event.data.subscription_code);
        if (sub) {
          await supabase
            .from("subscriptions")
            .update({ plan_type: "cancelled" })
            .eq("user_id", sub.user_id);

          await supabase
            .from("user_subscriptions")
            .update({ tier: "free_registered", subscription_active: false })
            .eq("user_id", sub.user_id);

          await logEvent(sub.user_id, "subscription_cancelled");

          try {
            await supabase.from("notifications").insert({
              user_id: sub.user_id,
              type: "subscription",
              title: "Subscription Cancelled",
              message: "Your Pro subscription has been cancelled. You'll retain access until the end of your billing period.",
              action_url: "/settings",
            });
          } catch (_) { /* non-blocking */ }
        }
        break;
      }

      case "subscription.expiring_cards": {
        const cardUserId = event.data.customer?.metadata?.user_id;
        if (cardUserId) {
          try {
            await supabase.from("notifications").insert({
              user_id: cardUserId,
              type: "payment_warning",
              title: "Card Expiring Soon",
              message: "Your payment card is expiring soon. Please update your payment method to avoid service interruption.",
              action_url: "/settings",
            });
          } catch (_) { /* non-blocking */ }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoiceUserId = event.data.metadata?.user_id;
        if (invoiceUserId) {
          await logEvent(invoiceUserId, "payment_failed", event.data.reference);
        }
        break;
      }

      default:
        console.log("Unhandled billing webhook event:", event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Billing webhook error:", err);
    return new Response("Server error", { status: 500 });
  }
});
