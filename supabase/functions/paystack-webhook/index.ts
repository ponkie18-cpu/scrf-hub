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

    // Verify webhook signature
    const hash = createHmac("sha512", webhookSecret).update(body).digest("hex");
    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Paystack webhook event:", event.event);

    // Service role client for privileged operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (event.event) {
      case "charge.success": {
        const { reference, metadata, customer, amount, currency } = event.data;
        const userId = metadata?.user_id;
        if (!userId) {
          console.error("No user_id in metadata for ref:", reference);
          break;
        }

        // Record payment
        await supabase.from("payment_history").insert({
          user_id: userId,
          amount,
          currency: currency || "ZAR",
          reference,
          paystack_status: "success",
          plan_code: metadata?.plan || "monthly",
          metadata: event.data,
        });

        // Calculate period end based on plan
        const periodEnd = new Date();
        if (metadata?.plan === "annual") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Activate subscription
        await supabase.rpc("activate_paid_subscription", {
          _user_id: userId,
          _paystack_customer_code: customer?.customer_code || null,
          _paystack_subscription_code: null,
          _plan_code: metadata?.plan || "monthly",
          _current_period_end: periodEnd.toISOString(),
        });

        // Update last payment reference
        await supabase
          .from("user_subscriptions")
          .update({ last_payment_reference: reference })
          .eq("user_id", userId);

        // Send in-app notification
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "subscription",
          title: "Pro Subscription Activated! 🎉",
          message: `Your SCRF Pro ${metadata?.plan === "annual" ? "Annual" : "Monthly"} plan is now active. Enjoy unlimited access to all tools.`,
          action_url: "/dashboard",
        });

        console.log("Subscription activated for user:", userId);
        break;
      }

      case "subscription.create": {
        const { customer, subscription_code, plan, next_payment_date } = event.data;
        const userId = event.data.metadata?.user_id;
        if (!userId) break;

        await supabase
          .from("user_subscriptions")
          .update({
            paystack_subscription_code: subscription_code,
            paystack_customer_code: customer?.customer_code,
            current_period_end: next_payment_date,
            subscription_active: true,
          })
          .eq("user_id", userId);

        break;
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        // Find user by subscription code
        const subCode = event.data.subscription_code;
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("paystack_subscription_code", subCode)
          .maybeSingle();

        if (sub?.user_id) {
          await supabase.rpc("deactivate_subscription", { _user_id: sub.user_id });

          await supabase.from("notifications").insert({
            user_id: sub.user_id,
            type: "subscription",
            title: "Subscription Ended",
            message: "Your Pro subscription has ended. Resubscribe to continue using all tools.",
            action_url: "/settings",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedUserId = event.data.metadata?.user_id;
        if (failedUserId) {
          await supabase.from("notifications").insert({
            user_id: failedUserId,
            type: "payment_warning",
            title: "Payment Failed",
            message: "We couldn't process your subscription payment. Please update your payment method to keep Pro access.",
            action_url: "/settings",
          });
        }
        break;
      }

      default:
        console.log("Unhandled event:", event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response("Server error", { status: 500 });
  }
});
