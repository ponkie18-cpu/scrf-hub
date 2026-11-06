const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl mx-auto py-16 px-4">
        <h1 className="font-display text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: 1 April 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              This Privacy Policy explains how <strong>Tsa Dinaledi (Pty) Ltd</strong> ("we", "us", "our"), operating
              the SCRF Hub platform ("Platform"), collects, uses, stores, and protects your personal information in
              compliance with the <strong>Protection of Personal Information Act 4 of 2013</strong> (POPIA).
            </p>
            <p>
              <strong>Information Officer:</strong> Ponkie Sobahle<br />
              Email: <a href="mailto:info@tsadinaledi.co.za" className="text-primary hover:underline">info@tsadinaledi.co.za</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Personal Information We Collect</h2>
            <p>We collect the following categories of personal information:</p>
            
            <h3 className="text-lg font-medium text-foreground mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account information:</strong> Name, email address</li>
              <li><strong>Company information:</strong> Business name, industry, size, region, legal structure, revenue band</li>
              <li><strong>Assessment data:</strong> Risk scores, assessment responses, action items</li>
              <li><strong>Feedback:</strong> Survey responses, feature requests, support enquiries</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Usage data:</strong> Pages visited, features used, session duration</li>
              <li><strong>Device information:</strong> Browser type, operating system, screen resolution</li>
              <li><strong>AI interaction data:</strong> Queries sent to the AI agent, response quality ratings</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">2.3 Payment Information</h3>
            <p>
              Payment processing is handled by <strong>Paystack</strong>, a PCI-DSS Level 1 compliant payment processor.
              We do not store your credit card or bank account details. Paystack's privacy policy governs the handling
              of your payment information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Purpose of Processing</h2>
            <p>We process your personal information for the following purposes (POPIA Section 13):</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Service delivery:</strong> To provide risk assessments, AI-powered guidance, and dashboard analytics</li>
              <li><strong>Account management:</strong> To manage your subscription, authenticate your identity, and process payments</li>
              <li><strong>Platform improvement:</strong> To analyse usage patterns and improve our tools and AI accuracy</li>
              <li><strong>Communication:</strong> To send service notifications, billing alerts, and — with your consent — product updates</li>
              <li><strong>Legal compliance:</strong> To meet our obligations under South African law, including POPIA, CPA, and ECTA</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Lawful Basis for Processing</h2>
            <p>We process your personal information based on:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Consent:</strong> You consent to processing when you create an account and use the Platform (POPIA Section 11(1)(a))</li>
              <li><strong>Contract:</strong> Processing is necessary to fulfil our service agreement with you (POPIA Section 11(1)(b))</li>
              <li><strong>Legitimate interest:</strong> To improve the Platform and protect against fraud (POPIA Section 11(1)(f))</li>
              <li><strong>Legal obligation:</strong> To comply with applicable South African legislation (POPIA Section 11(1)(c))</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Paystack:</strong> For payment processing (PCI-DSS compliant)</li>
              <li><strong>Google (Gemini API):</strong> Your queries are processed by Google's AI models. We do not send
                personally identifiable information — only anonymised business context for generating responses.</li>
              <li><strong>Law enforcement:</strong> When required by South African law or a valid court order</li>
            </ul>
            <p>
              We do not transfer personal information outside the Republic of South Africa except where the recipient
              is subject to adequate data protection safeguards (POPIA Section 72).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account data:</strong> Retained while your account is active, plus 12 months after deletion</li>
              <li><strong>Assessment data:</strong> Retained while your account is active</li>
              <li><strong>AI conversation logs:</strong> Retained for 90 days for quality assurance, then anonymised</li>
              <li><strong>Payment records:</strong> Retained for 5 years as required by South African tax law</li>
              <li><strong>Audit logs:</strong> Retained for 12 months</li>
            </ul>
            <p>
              You may request earlier deletion of your data (see Section 8 below), subject to our legal retention obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Data Security</h2>
            <p>We implement the following security measures to protect your data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption in transit (TLS 1.2+) and at rest (AES-256)</li>
              <li>Row-Level Security (RLS) ensuring users can only access their own data</li>
              <li>Role-based access control for administrative functions</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Secure authentication with email verification</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Your Rights Under POPIA</h2>
            <p>As a data subject, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> Request confirmation of what personal information we hold about you (Section 23)</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete personal information (Section 24)</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements (Section 24)</li>
              <li><strong>Object:</strong> Object to the processing of your personal information on reasonable grounds (Section 11(3))</li>
              <li><strong>Withdraw consent:</strong> Withdraw consent at any time, without affecting the lawfulness of prior processing</li>
              <li><strong>Complain:</strong> Lodge a complaint with the Information Regulator of South Africa</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:info@tsadinaledi.co.za" className="text-primary hover:underline">info@tsadinaledi.co.za</a>.</p>
            <p>We will respond to your request within <strong>30 days</strong> as required by POPIA.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Cookies & Tracking</h2>
            <p>
              The Platform uses essential cookies for authentication and session management. We do not use third-party
              advertising trackers. Analytics data is collected in aggregate form and cannot be used to identify individual users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Children's Privacy</h2>
            <p>
              The Platform is not intended for use by persons under the age of 18. We do not knowingly collect personal
              information from children. If we become aware that a child has provided us with personal information, we
              will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Information Regulator</h2>
            <p>
              If you are unsatisfied with how we handle your personal information, you may lodge a complaint with:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>The Information Regulator (South Africa)</strong></li>
              <li>Website: <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">inforegulator.org.za</a></li>
              <li>Email: complaints.IR@justice.gov.za</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
              effective date. Material changes will be communicated via email. Continued use of the Platform after
              changes constitutes acceptance of the revised policy.
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

export default PrivacyPolicy;
