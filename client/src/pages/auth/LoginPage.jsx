import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Zap, UserCircle2, Building2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'freelancer' | 'company' | null
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const handleLoginWithCredentials = async (email, password) => {
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      showToast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message 
        || (err.message && err.message.includes('Network') ? 'Unable to reach backend server. Please verify port 5000 is running.' : 'Login failed. Please check your credentials.');
      showToast(msg, 'error');
    } finally {
      setLoading(false);
      setDemoLoading(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginWithCredentials(form.email, form.password);
  };

  const handleQuickDemo = (type) => {
    setDemoLoading(type);
    if (type === 'freelancer') {
      setForm({ email: 'demo@freelancehub.app', password: 'Demo@12345' });
      handleLoginWithCredentials('demo@freelancehub.app', 'Demo@12345');
    } else {
      setForm({ email: 'company@freelancehub.app', password: 'Demo@12345' });
      handleLoginWithCredentials('company@freelancehub.app', 'Demo@12345');
    }
  };

  return (
    <div className="min-h-screen bg-surface-subtle flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-primary">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            FreelanceHub
          </Link>
        </div>

        <div className="bg-surface rounded-card border border-border p-6 sm:p-8 shadow-card">
          <h1 className="text-2xl font-bold text-text mb-1">Welcome back</h1>
          <p className="text-text-muted text-sm mb-6">Sign in to your FreelanceHub account</p>

          {/* Quick 1-Click Demo Login Section */}
          <div className="mb-6 p-4 rounded-xl bg-surface-subtle border border-border/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                ⚡ 1-Click Instant Demo Login
              </span>
              <span className="text-[11px] text-accent font-medium">Ready to test</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('freelancer')}
                disabled={loading}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface hover:border-accent hover:bg-accent/5 transition-all text-left group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                    <UserCircle2 className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text truncate">Demo Freelancer</p>
                    <p className="text-[10px] text-text-muted truncate">Alex Freelancer</p>
                  </div>
                </div>
                {demoLoading === 'freelancer' ? (
                  <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('company')}
                disabled={loading}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface hover:border-accent hover:bg-accent/5 transition-all text-left group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-purple-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text truncate">Demo Company</p>
                    <p className="text-[10px] text-text-muted truncate">Apex Innovations</p>
                  </div>
                </div>
                {demoLoading === 'company' ? (
                  <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                )}
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-text-muted text-xs uppercase tracking-wider">or sign in with email</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <Button type="submit" variant="primary" className="w-full mt-2" loading={loading && !demoLoading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent font-medium hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
