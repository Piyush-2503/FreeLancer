export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-bold text-text mb-3">Terms of Service</h1>
      <p className="text-text-muted text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <div className="space-y-6 text-text-secondary">
        <section>
          <h2 className="text-xl font-semibold text-text mb-2">1. Acceptance of Terms</h2>
          <p>By using FreelanceHub, you agree to these Terms of Service. If you do not agree, please do not use the service.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text mb-2">2. Account Responsibilities</h2>
          <p>You are responsible for maintaining the security of your account credentials and all activities that occur under your account.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text mb-2">3. Acceptable Use</h2>
          <p>You may not use FreelanceHub for any unlawful purpose, to transmit spam, or to infringe on third-party intellectual property rights.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text mb-2">4. Service Availability</h2>
          <p>We strive for high availability but do not guarantee uninterrupted access. We reserve the right to modify or discontinue features with reasonable notice.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text mb-2">5. Limitation of Liability</h2>
          <p>FreelanceHub is provided "as is". We are not liable for any indirect, incidental, or consequential damages arising from use of the service.</p>
        </section>
      </div>
    </div>
  );
}
