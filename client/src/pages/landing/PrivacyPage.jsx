export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-bold text-text mb-3">Privacy Policy</h1>
      <p className="text-text-muted text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <div className="prose prose-slate max-w-none space-y-6 text-text-secondary">
        <section>
          <h2 className="text-xl font-semibold text-text mb-2">1. Data We Collect</h2>
          <p>We collect information you provide directly: name, email, business details, and the data you enter about your clients, projects, invoices, and time entries.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text mb-2">2. How We Use Your Data</h2>
          <p>Your data is used exclusively to provide the FreelanceHub service. We never sell your data to third parties or use it for advertising.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text mb-2">3. Data Security</h2>
          <p>We use bcrypt for password hashing, JWT with HTTP-only cookies for authentication, and enforce strict data ownership — you only ever see your own data.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text mb-2">4. Data Retention</h2>
          <p>Your data is retained for as long as your account is active. You may request deletion at any time by contacting us.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text mb-2">5. Contact</h2>
          <p>For privacy questions, contact us through our Contact page.</p>
        </section>
      </div>
    </div>
  );
}
