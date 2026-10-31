import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, FileText,
  Receipt, FileSignature, Settings, Menu, Zap, ChevronRight, LogOut,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/opportunities', label: 'Opportunities', icon: Briefcase },
  { to: '/dashboard/clients', label: 'Clients', icon: Users },
  { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { to: '/dashboard/proposals', label: 'Proposals', icon: FileText },
  { to: '/dashboard/contracts', label: 'Contracts', icon: FileSignature },
  { to: '/dashboard/invoices', label: 'Invoices', icon: Receipt },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  const isActive = (link) => {
    if (link.exact) return location.pathname === link.to;
    return location.pathname.startsWith(link.to);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface">
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-border/70 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-[#4F46E5] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
          F
        </div>
        {!collapsed && <span className="font-bold text-text text-lg tracking-tight">FreelanceHub</span>}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sidebarLinks.map(link => {
          const Icon = link.icon;
          const active = isActive(link);
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? link.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-indigo-50/80 text-[#4F46E5] shadow-xs'
                  : 'text-text-secondary hover:bg-surface-subtle hover:text-text'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#4F46E5]' : 'text-text-muted'}`} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Info at Bottom of Sidebar */}
      <div className="border-t border-border/80 p-3 bg-surface">
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-[#4F46E5] flex items-center justify-center font-semibold text-xs shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text truncate">{user.name}</p>
              <p className="text-[11px] text-text-muted truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-subtle overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-surface border-r border-border transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 bg-surface border-r border-border">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-surface border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <button
              className="md:hidden p-1.5 rounded-input text-text-secondary hover:bg-surface-subtle cursor-pointer"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop collapse */}
            <button
              className="hidden md:flex p-1.5 rounded-input text-text-muted hover:bg-surface-subtle cursor-pointer"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu className="w-4 h-4" />
            </button>

            <span className="text-sm font-medium text-text-secondary">FreelanceHub Console</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] text-xs font-semibold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-text">{user.name}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-danger hover:bg-danger-soft px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
