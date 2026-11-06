import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl mx-auto py-16 px-4">
        <h1 className="font-display text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: 1 April 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              These Terms of Service ("Terms") govern your use of the SCRF Hub platform ("Platform"), operated by
              <strong> Tsa Dinaledi (Pty) Ltd</strong> (Registration No. pending), a company registered in the Republic of South Africa
              ("we", "us", "our").
            </p>
            <p>
              By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, you must
              discontinue use immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Service Description</h2>
            <p>
              SCRF Hub provides AI-powered business resilience and risk assessment tools for small and medium enterprises (SMEs).
              The Platform offers:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Risk assessment tools across operational, financial, compliance, and strategic domains</li>
              <li>An AI-powered resilience agent for business guidance</li>
              <li>Dashboard analytics and progress tracking</li>
              <li>PDF report generation and action item management</li>
            </ul>
            <p>
              <strong>Important:</strong> SCRF Hub does not provide tax advice, legal advice, or financial advisory services.
              For tax matters, consult a registered tax practitioner. For legal matters, consult a qualified attorney.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Eligibility</h2>
            <p>
              You must be at least 18 years old and legally capable of entering into binding agreements under South African law.
              By registering, you confirm that the information you provide is accurate and complete.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Account Registration & Security</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide a valid email address to register.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You must notify us immediately of any unauthorised access to your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Subscription Plans & Payment</h2>
            <p>The Platform offers the following plans:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Free Plan:</strong> Limited access to basic risk assessment tools.</li>
              <li><strong>Pro Trial:</strong> 14-day free trial with full Pro access. No payment required.</li>
              <li><strong>Pro Monthly:</strong> R299/month, billed via Paystack in South African Rand (ZAR).</li>
              <li><strong>Pro Annual:</strong> R2,990/year, billed via Paystack in ZAR.</li>
            </ul>
            <p>
              All payments are processed securely by <strong>Paystack</strong>, a PCI-DSS compliant payment processor.
              By subscribing, you authorise recurring charges at the start of each billing cycle.
            </p>
            <p>
              For details on cancellations and refunds, see our{" "}
              <Link to="/cancellation-policy" className="text-primary hover:underline">Cancellation Policy</Link> and{" "}
              <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Platform for any unlawful purpose or in violation of any applicable law</li>
              <li>Attempt to gain unauthorised access to any part of the Platform or its systems</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Platform</li>
              <li>Use automated tools (bots, scrapers) to access the Platform without prior written consent</li>
              <li>Share your account credentials with third parties</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Use AI-generated outputs to provide professional tax, legal, or financial advice to third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Intellectual Property</h2>
            <p>
              All content, designs, logos, text, software, and other materials on the Platform are the intellectual property
              of Tsa Dinaledi (Pty) Ltd and are protected under South African copyright and intellectual property law.
            </p>
            <p>
              <strong>Your data:</strong> You retain ownership of all business data you input into the Platform. We do not
              claim ownership of your data. See our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> for details on how
              we process and protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. AI-Generated Content Disclaimer</h2>
            <p>
              The Platform uses artificial intelligence to generate risk assessments, recommendations, and guidance.
              While we strive for accuracy:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>AI-generated content is for <strong>informational purposes only</strong> and does not constitute professional advice.</li>
              <li>You should independently verify all AI-generated outputs before making business decisions.</li>
              <li>We do not guarantee the accuracy, completeness, or suitability of AI-generated content.</li>
              <li>The Platform explicitly excludes tax advice — all tax-related queries are redirected to registered tax practitioners.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by South African law:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The Platform is provided "as is" without warranties of any kind, express or implied.</li>
              <li>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</li>
              <li>Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.</li>
              <li>We are not liable for any losses arising from reliance on AI-generated content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Data Protection</h2>
            <p>
              We process personal information in accordance with the <strong>Protection of Personal Information Act 4 of 2013</strong> (POPIA).
              For full details, see our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Termination</h2>
            <p>
              We may suspend or terminate your access to the Platform at any time if you breach these Terms.
              You may terminate your account at any time via the Settings page or by contacting us.
              Upon termination, your right to use the Platform ceases immediately, but your data will be retained
              in accordance with our Privacy Policy and applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Governing Law & Jurisdiction</h2>
            <p>
              These Terms are governed by the laws of the <strong>Republic of South Africa</strong>. Any disputes arising
              from these Terms shall be subject to the exclusive jurisdiction of the courts of South Africa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">13. Consumer Protection</h2>
            <p>
              These Terms are subject to the <strong>Consumer Protection Act 68 of 2008</strong> (CPA) and the
              <strong> Electronic Communications and Transactions Act 25 of 2002</strong> (ECTA).
              Nothing in these Terms limits your rights under applicable South African consumer protection legislation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">14. Changes to These Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. Changes will be posted on this page with an
              updated effective date. Continued use of the Platform after changes constitutes acceptance of the revised Terms.
              Material changes will be communicated via email where possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">15. Contact</h2>
            <p>For questions about these Terms, contact us at:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: <a href="mailto:info@tsadinaledi.co.za" className="text-primary hover:underline">info@tsadinaledi.co.za</a></li>
              <li>Entity: Tsa Dinaledi (Pty) Ltd, South Africa</li>
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

export default TermsOfService;
