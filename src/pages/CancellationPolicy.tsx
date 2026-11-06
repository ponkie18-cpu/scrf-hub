import { Link } from "react-router-dom";

const CancellationPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl mx-auto py-16 px-4">
        <h1 className="font-display text-3xl font-bold mb-2">Cancellation Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: 1 April 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Overview</h2>
            <p>
              This Cancellation Policy applies to all paid subscriptions on the SCRF Hub platform ("Platform"),
              operated by <strong>Tsa Dinaledi (Pty) Ltd</strong>, a company registered in the Republic of South Africa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Free Trial</h2>
            <p>
              All new users receive a <strong>14-day free Pro trial</strong> at no cost. No payment information is required.
              If you do not subscribe before the trial ends, your account automatically reverts to the Free plan —
              you will not be charged.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. How to Cancel</h2>
            <p>You can cancel your subscription at any time using one of the following methods:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Self-service:</strong> Navigate to <strong>Settings → Billing</strong> in your SCRF Hub dashboard and click "Cancel Subscription".</li>
              <li><strong>Email:</strong> Send a cancellation request to <a href="mailto:info@tsadinaledi.co.za" className="text-primary hover:underline">info@tsadinaledi.co.za</a> from the email address associated with your account.</li>
            </ul>
            <p>Cancellation requests via email will be processed within <strong>2 business days</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. What Happens After Cancellation</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You <strong>retain full Pro access</strong> until the end of your current paid billing period.</li>
              <li>No further charges will be applied after cancellation takes effect.</li>
              <li>After your billing period ends, your account reverts to the <strong>Free plan</strong>.</li>
              <li>Your data is <strong>preserved</strong> — you may resubscribe at any time to regain Pro access and all your saved data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. What You Lose on Downgrade</h2>
            <p>When your account reverts to the Free plan, you will lose access to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Advanced risk assessment tools (16 Pro tools → 3 Free tools)</li>
              <li>AI-powered resilience agent</li>
              <li>PDF report generation</li>
              <li>Unlimited saves (Free plan is limited to 3 saves)</li>
              <li>Dashboard analytics and progress tracking</li>
            </ul>
            <p>
              Your saved data is not deleted. If you resubscribe, all your assessments, action items, and history
              will be restored.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Annual Plan Cancellation</h2>
            <p>
              If you are on the annual plan (R2,990/year), cancellation will take effect at the end of your
              annual billing period. We do not offer partial-year refunds for annual plans.
            </p>
            <p>
              See our <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link> for
              details on exceptional refund circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Account Deletion</h2>
            <p>
              Cancelling your subscription does <strong>not</strong> delete your account. If you wish to permanently
              delete your account and all associated data:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Navigate to <strong>Settings → Account</strong> and click "Delete My Account", or</li>
              <li>Email <a href="mailto:info@tsadinaledi.co.za" className="text-primary hover:underline">info@tsadinaledi.co.za</a> with the subject "Account Deletion Request"</li>
            </ul>
            <p>
              Account deletion is permanent and irreversible. All data will be deleted in accordance with our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> and POPIA retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Consumer Protection</h2>
            <p>
              This policy is subject to the <strong>Consumer Protection Act 68 of 2008</strong> (CPA) and the
              <strong> Electronic Communications and Transactions Act 25 of 2002</strong> (ECTA) of the Republic of South Africa.
              Nothing in this policy limits your rights under applicable South African consumer protection legislation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Contact</h2>
            <p>For cancellation assistance or questions, contact us at:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: <a href="mailto:info@tsadinaledi.co.za" className="text-primary hover:underline">info@tsadinaledi.co.za</a></li>
              <li>Subject line: <em>"Cancellation Request — [Your Account Email]"</em></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground">
          <p>Tsa Dinaledi (Pty) Ltd · South Africa · info@tsadinaledi.co.za</p>
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy;
