import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder - would integrate with backend
    setSent(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-bold text-text mb-3">Contact Us</h1>
      <p className="text-text-secondary mb-8">Have a question or feedback? We'd love to hear from you.</p>

      {sent ? (
        <div className="bg-success-soft border border-success/30 rounded-card p-6 text-center">
          <h3 className="text-success font-semibold text-lg mb-2">Message Sent!</h3>
          <p className="text-text-secondary text-sm">We'll get back to you within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text">Message</label>
            <textarea
              className="w-full px-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors resize-none"
              rows={5}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" variant="primary">Send Message</Button>
        </form>
      )}
    </div>
  );
}
