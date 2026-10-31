import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              FreelanceHub
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-accent' : 'text-text-secondary hover:text-text'}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-text-secondary hover:text-text transition-colors"
              >
                Login
              </Link>
              <Link
                to={user ? '/dashboard' : '/register'}
                className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-input hover:bg-accent-dark transition-colors"
              >
                {user ? 'Dashboard' : 'Get Started'}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-input text-text-secondary hover:bg-surface-subtle"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 py-3 space-y-2">
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="block py-2 text-sm text-text-secondary hover:text-text"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <Link to="/login" className="py-2 text-sm text-text-secondary" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link
                to={user ? '/dashboard' : '/register'}
                className="py-2 px-4 bg-accent text-white text-sm font-medium rounded-input text-center"
                onClick={() => setMobileOpen(false)}
              >
                {user ? 'Dashboard' : 'Get Started'}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-lg mb-3">
                <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                FreelanceHub
              </div>
              <p className="text-sm text-slate-400">Everything you need to run your freelance business.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-700 text-sm text-slate-500 text-center">
            © {new Date().getFullYear()} FreelanceHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
