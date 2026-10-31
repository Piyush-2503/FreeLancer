export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-bold text-text mb-6">About FreelanceHub</h1>
      <p className="text-text-secondary text-lg leading-relaxed mb-6">
        FreelanceHub was built by freelancers, for freelancers. We understand the challenges of running an independent business —
        from chasing invoices to managing multiple clients and tracking every billable hour.
      </p>
      <p className="text-text-secondary text-lg leading-relaxed mb-6">
        Our mission is to give every Indian freelancer the same powerful tools that big agencies use, at a price that makes sense
        for independent professionals.
      </p>
      <div className="bg-accent-soft rounded-card p-6 border border-accent/20">
        <h2 className="text-xl font-semibold text-text mb-2">Our Values</h2>
        <ul className="space-y-2 text-text-secondary">
          <li>✦ Transparency — clear pricing, no hidden fees</li>
          <li>✦ Privacy — your data is yours, always</li>
          <li>✦ Simplicity — powerful but never complicated</li>
          <li>✦ Reliability — built to be your daily driver</li>
        </ul>
      </div>
    </div>
  );
}
