import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { plans } from '../../config/pricing.js';
import { CheckCircle } from 'lucide-react';

export default function PricingPage() {
  const { user } = useAuth();
  return (
    <div className="py-20 bg-surface-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-text mb-4">Pricing Plans</h1>
          <p className="text-text-secondary text-lg">Choose a plan that works for your business. Upgrade or downgrade anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`bg-surface rounded-card border-2 p-6 flex flex-col ${plan.highlighted ? 'border-accent shadow-xl scale-105' : 'border-border'}`}
            >
              {plan.highlighted && (
                <div className="inline-block px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold mb-4 self-start">Most Popular</div>
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
                    <CheckCircle className="w-4 h-4 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to={user ? '/dashboard' : '/register'}
                className={`block text-center py-2.5 rounded-input font-medium text-sm transition-colors ${plan.highlighted ? 'bg-accent text-white hover:bg-accent-dark' : 'border border-border text-text hover:bg-surface-subtle'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
