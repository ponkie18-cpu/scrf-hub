const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl mx-auto py-16 px-4">
        <h1 className="font-display text-3xl font-bold mb-2">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: 1 April 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Overview</h2>
            <p>
              SCRF Hub ("we", "us", "our") is operated by Tsa Dinaledi (Pty) Ltd, a company registered in South Africa.
              This Refund Policy applies to all subscription plans and services offered through the SCRF Hub platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Free Trial</h2>
            <p>
              All new users receive a <strong>14-day free Pro trial</strong> at no cost. No payment information is required
              to start the trial. If you do not subscribe before the trial ends, your account reverts to the Free plan
              automatically — you will not be charged.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Subscription Payments</h2>
            <p>
              Paid subscriptions are billed in <strong>South African Rand (ZAR)</strong> via Paystack, either monthly
              (R299/month) or annually (R2,990/year). Payments are processed at the start of each billing cycle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Cancellation</h2>
            <p>
              You may cancel your subscription at any time from your account Settings. Upon cancellation:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You retain Pro access until the end of your current paid billing period.</li>
              <li>No further charges will be applied after cancellation.</li>
              <li>Your data is preserved — you may resubscribe at any time to regain Pro access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Refund Policy</h2>
            <p>
              Because SCRF Hub offers a <strong>free 14-day trial</strong> that provides full access to all Pro features
              before any payment is required, <strong>all subscription payments are final and non-refundable</strong>.
            </p>
            <p>We do not offer refunds for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Partial months or years of service</li>
              <li>Unused subscription time after cancellation</li>
              <li>Downgrade from an annual to monthly plan</li>
              <li>Failure to cancel before a renewal date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Exceptions</h2>
            <p>
              We may, at our sole discretion, consider a refund in the following exceptional circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Duplicate charges:</strong> If you were charged more than once for the same billing period due to a technical error.</li>
              <li><strong>Billing error:</strong> If you were charged after a confirmed cancellation.</li>
              <li><strong>Extended platform outage:</strong> If the platform was unavailable for more than 72 consecutive hours during your billing period.</li>
            </ul>
            <p>
              Refund requests under these exceptions must be submitted within <strong>30 days</strong> of the charge
              and will be reviewed within 5 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. How to Request a Refund</h2>
            <p>
              If you believe you qualify for a refund under the exceptions above, contact us at:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: <a href="mailto:info@tsadinaledi.co.za" className="text-primary hover:underline">info@tsadinaledi.co.za</a></li>
              <li>Subject line: <em>"Refund Request — [Your Account Email]"</em></li>
            </ul>
            <p>
              Please include your account email, the date of the charge, and a brief description of the issue.
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
            <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>
              We reserve the right to update this Refund Policy at any time. Changes will be posted on this page
              with an updated effective date. Continued use of the platform after changes constitutes acceptance
              of the revised policy.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground">
          <p>Tsa Dinaledi (Pty) Ltd · South Africa · info@tsadinaledi.co.za</p>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
