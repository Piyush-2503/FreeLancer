import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Users, Receipt, Clock, FileText, Shield, BarChart3,
  Globe, CreditCard, FileSignature, ArrowRight
} from 'lucide-react';

const features = [
  { icon: Users, title: 'Client Management', description: 'Centralize all your client info, notes, and communication history in one place.' },
  { icon: Clock, title: 'Time Tracking', description: 'Log billable hours with one click. Automatic timers, manual entry, and detailed reports.' },
  { icon: Receipt, title: 'Smart Invoicing', description: 'Generate professional invoices in seconds with automated tax calculation and payment tracking.' },
  { icon: FileSignature, title: 'Contract Management', description: 'Create, send, and get digital signatures on contracts.' },
  { icon: FileText, title: 'Proposal Builder', description: 'Win more clients with beautiful, branded proposals.' },
  { icon: CreditCard, title: 'Payment Integration', description: 'Accept online payments via Razorpay directly from invoices.' },
  { icon: Globe, title: 'Client Portal', description: 'Give clients a dedicated portal to view invoices and approve proposals.' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'See your revenue, hours, and business health at a glance.' },
  { icon: Shield, title: 'Secure & Private', description: 'Bank-level encryption. Your business data stays yours.' },
];

export default function FeaturesPage() {
  const { user } = useAuth();
  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-text mb-4">All Features</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            FreelanceHub is packed with everything you need to run a professional freelance business.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-surface rounded-card p-6 border border-border hover:shadow-card transition-shadow">
                <div className="w-12 h-12 bg-accent-soft rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-text mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-14">
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white font-semibold rounded-input hover:bg-accent-dark transition-colors"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
