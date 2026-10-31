import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { plans } from '../../config/pricing.js';
import {
  Users, Receipt, Clock, FileText, Zap, Shield, BarChart3,
  Smartphone, Globe, CheckCircle, ChevronDown, ChevronUp,
  ArrowRight, Star, TrendingUp, CreditCard, FileSignature
} from 'lucide-react';

const features = [
  { icon: Users, title: 'Client Management', description: 'Centralize all your client info, notes, and communication history in one place.' },
  { icon: FolderKanbanIcon, title: 'Project Tracking', description: 'Track project status, milestones, and deliverables with a visual Kanban board.' },
  { icon: Clock, title: 'Time Tracking', description: 'Log billable hours with one click. Automatic timers, manual entry, and detailed reports.' },
  { icon: Receipt, title: 'Smart Invoicing', description: 'Generate professional invoices in seconds with automated tax calculation and payment tracking.' },
  { icon: FileSignature, title: 'Contract Management', description: 'Create, send, and get digital signatures on contracts — all within FreelanceHub.' },
  { icon: FileText, title: 'Proposal Builder', description: 'Win more clients with beautiful, branded proposals that convert to projects in one click.' },
  { icon: CreditCard, title: 'Payment Integration', description: 'Accept online payments via Razorpay. Clients pay directly from invoices.' },
  { icon: Globe, title: 'Client Portal', description: 'Give clients a dedicated portal to view invoices, approve proposals, and track progress.' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'See your revenue, hours, and business health at a glance with real-time analytics.' },
  { icon: Shield, title: 'Secure & Private', description: 'Bank-level encryption, JWT auth, and data never shared or sold. Your business stays yours.' },
];

function FolderKanbanIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 6h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/><path d="M2 6l2-4h6l2 4"/>
      <path d="M7 11h2m4 0h4M7 15h2m4 0h4"/>
    </svg>
  );
}

const steps = [
  { num: '01', title: 'Add Your Clients', description: 'Import or add clients manually. Capture contact info, notes, and business details.' },
  { num: '02', title: 'Create Projects & Track Time', description: 'Set up projects, assign budgets, and log hours directly against client work.' },
  { num: '03', title: 'Send Invoices & Proposals', description: 'Generate invoices from tracked time or fixed rates. Send branded proposals instantly.' },
  { num: '04', title: 'Get Paid & Grow', description: 'Accept online payments, track outstanding amounts, and watch your business scale.' },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Freelance Designer',
    text: 'FreelanceHub transformed how I manage my clients. I went from spending 5 hours a week on admin to under 30 minutes.',
    rating: 5,
  },
  {
    name: 'Rahul Mehta',
    role: 'Independent Developer',
    text: 'The invoicing and payment features alone are worth it. My collection rate improved dramatically after switching.',
    rating: 5,
  },
  {
    name: 'Anjali Nair',
    role: 'Content Strategist',
    text: 'The client portal is a game-changer. My clients love having a professional space to review proposals and invoices.',
    rating: 5,
  },
];

const faqs = [
  {
    q: 'Is FreelanceHub free to use?',
    a: 'Yes! We offer a free plan that covers up to 3 clients and 5 invoices per month — perfect for getting started. Paid plans unlock unlimited usage and advanced features.',
  },
  {
    q: 'Which payment gateways are supported?',
    a: 'We currently support Razorpay for online payments. More gateways are coming soon. You can also record offline payments manually.',
  },
  {
    q: 'Can my clients see my invoices and proposals online?',
    a: 'Yes, each client gets a secure portal link where they can view invoices, download PDFs, approve proposals, and make payments.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use industry-standard JWT authentication with HTTP-only cookies, bcrypt password hashing, and all data is scoped strictly to your account.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes, you can upgrade or downgrade at any time. When upgrading, you\'ll get immediate access to all features. Downgrading takes effect at the next billing cycle.',
  },
  {
    q: 'Does FreelanceHub support GST?',
    a: 'Yes. You can add your GSTIN, set default tax rates, and invoices will automatically calculate and display GST breakdowns.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-subtle transition-colors"
      >
        <span className="font-medium text-text text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-text-secondary">
          {a}
        </div>
      )}
    </div>
  );
}

// Dashboard mockup component
function DashboardMockup() {
  return (
    <div className="relative bg-surface rounded-card border border-border shadow-xl overflow-hidden text-xs">
      {/* Top bar */}
      <div className="bg-primary px-4 py-2 flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-slate-400 text-xs">FreelanceHub Dashboard</span>
      </div>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-32 bg-surface-subtle border-r border-border p-3 space-y-1">
          {['Overview', 'Clients', 'Projects', 'Invoices', 'Time', 'Settings'].map((item, i) => (
            <div key={item} className={`px-2 py-1.5 rounded text-xs ${i === 0 ? 'bg-accent-soft text-accent font-medium' : 'text-text-muted'}`}>
              {item}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-4 space-y-3">
          <p className="font-semibold text-text text-sm">Good morning, Alex 👋</p>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Active Clients', val: '12', color: 'text-accent' },
              { label: 'This Month', val: '₹84,200', color: 'text-success' },
              { label: 'Outstanding', val: '₹23,000', color: 'text-warning' },
              { label: 'Hrs This Week', val: '28.5h', color: 'text-text' },
            ].map(s => (
              <div key={s.label} className="bg-surface border border-border rounded p-2">
                <p className="text-text-muted" style={{ fontSize: '9px' }}>{s.label}</p>
                <p className={`font-bold ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>
          {/* Recent invoices */}
          <div className="bg-surface border border-border rounded p-2">
            <p className="font-medium text-text mb-1" style={{ fontSize: '10px' }}>Recent Invoices</p>
            {[
              { client: 'ACME Corp', amt: '₹12,400', status: 'Paid', color: 'text-success' },
              { client: 'Bright Ideas', amt: '₹8,000', status: 'Pending', color: 'text-warning' },
              { client: 'Nova Tech', amt: '₹15,600', status: 'Overdue', color: 'text-danger' },
            ].map(inv => (
              <div key={inv.client} className="flex justify-between py-0.5 border-b border-border last:border-0">
                <span className="text-text-secondary">{inv.client}</span>
                <span className="font-medium text-text">{inv.amt}</span>
                <span className={`font-medium ${inv.color}`}>{inv.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Label */}
      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
        Illustrative preview – demo data
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-accent/80 text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm mb-6">
                <Zap className="w-3.5 h-3.5" />
                All-in-one freelance platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Everything You Need to Run Your{' '}
                <span className="text-blue-300">Freelance Business.</span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Manage clients, track time, send invoices, and get paid — all from one
                beautifully designed workspace built for Indian freelancers.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-input hover:bg-slate-100 transition-colors"
                >
                  Start Free Today <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-input hover:bg-white/20 transition-colors"
                >
                  See All Features
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-400">No credit card required · Free plan available</p>
            </div>
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-surface-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Everything a freelancer needs
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              From first client contact to final payment, FreelanceHub handles the business side so you can focus on the work.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-surface rounded-card p-5 border border-border hover:shadow-card transition-shadow">
                  <div className="w-10 h-10 bg-accent-soft rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-text mb-2">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">How It Works</h2>
            <p className="text-text-secondary text-lg">Get up and running in minutes, not hours.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-border" />
                )}
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-white font-bold text-lg mb-4 z-10">
                  {step.num}
                </div>
                <h3 className="font-semibold text-text mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your business at a glance
            </h2>
            <p className="text-slate-300 text-lg">
              A clean, powerful dashboard that gives you complete visibility.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <DashboardMockup />
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-12 text-center">
            {[
              { icon: TrendingUp, label: 'Revenue Insights', desc: 'Monthly and yearly revenue breakdowns' },
              { icon: Clock, label: 'Billable Hours', desc: 'Track every hour across all projects' },
              { icon: Receipt, label: 'Invoice Status', desc: 'Outstanding, paid, and overdue at a glance' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-white">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-1">{item.label}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-surface-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">Simple, Transparent Pricing</h2>
            <p className="text-text-secondary text-lg">Start free, scale as you grow. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`bg-surface rounded-card border-2 p-6 flex flex-col ${
                  plan.highlighted ? 'border-accent shadow-xl scale-105' : 'border-border'
                }`}
              >
                {plan.highlighted && (
                  <div className="inline-block px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold mb-4 self-start">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-text">{plan.name}</h3>
                <p className="text-sm text-text-muted mb-4">{plan.description}</p>
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold text-text">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-text">₹{plan.price.toLocaleString('en-IN')}</span>
                      <span className="text-text-muted">/{plan.period}</span>
                    </>
                  )}
                </div>
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className={`block text-center py-2.5 rounded-input font-medium text-sm transition-colors ${
                    plan.highlighted
                      ? 'bg-accent text-white hover:bg-accent-dark'
                      : 'border border-border text-text hover:bg-surface-subtle'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">Loved by Freelancers</h2>
            <p className="text-text-secondary text-sm italic">[Sample testimonials – for illustration only]</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-surface-subtle rounded-card p-6 border border-border">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-text text-sm">{t.name}</p>
                  <p className="text-text-muted text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-surface-subtle">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-accent">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Freelance Business?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join freelancers who manage their business smarter with FreelanceHub.
            Free plan, no credit card required.
          </p>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-accent font-bold rounded-input hover:bg-blue-50 transition-colors text-lg"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
