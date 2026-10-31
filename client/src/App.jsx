import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { PortalProvider, usePortal } from './context/PortalContext.jsx';
import ToastHost from './components/ui/ToastHost.jsx';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Landing pages
import LandingPage from './pages/landing/LandingPage.jsx';
import AboutPage from './pages/landing/AboutPage.jsx';
import ContactPage from './pages/landing/ContactPage.jsx';
import PrivacyPage from './pages/landing/PrivacyPage.jsx';
import TermsPage from './pages/landing/TermsPage.jsx';
import FeaturesPage from './pages/landing/FeaturesPage.jsx';
import PricingPage from './pages/landing/PricingPage.jsx';

// Auth pages
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';

// Dashboard pages
import OverviewPage from './pages/dashboard/OverviewPage.jsx';
import OpportunitiesPage from './pages/dashboard/OpportunitiesPage.jsx';
import ClientsPage from './pages/dashboard/ClientsPage.jsx';
import ClientDetailPage from './pages/dashboard/ClientDetailPage.jsx';
import ProjectsPage from './pages/dashboard/ProjectsPage.jsx';
import ProjectDetailPage from './pages/dashboard/ProjectDetailPage.jsx';
import TimeTrackingPage from './pages/dashboard/TimeTrackingPage.jsx';
import ProposalsPage from './pages/dashboard/ProposalsPage.jsx';
import ProposalDetailPage from './pages/dashboard/ProposalDetailPage.jsx';
import InvoicesPage from './pages/dashboard/InvoicesPage.jsx';
import InvoiceDetailPage from './pages/dashboard/InvoiceDetailPage.jsx';
import ContractsPage from './pages/dashboard/ContractsPage.jsx';
import ContractDetailPage from './pages/dashboard/ContractDetailPage.jsx';
import SettingsPage from './pages/dashboard/SettingsPage.jsx';

// Public pages (no auth)
import ProposalViewPage from './pages/public/ProposalViewPage.jsx';
import ContractSignPage from './pages/public/ContractSignPage.jsx';

// Portal pages
import PortalLoginPage from './pages/portal/PortalLoginPage.jsx';
import PortalHomePage from './pages/portal/PortalHomePage.jsx';
import PortalProjectPage from './pages/portal/PortalProjectPage.jsx';
import PortalInvoicePage from './pages/portal/PortalInvoicePage.jsx';

// ─── Route Guards ────────────────────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-subtle flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function PortalRoute({ children }) {
  const { client, loading } = usePortal();
  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!client) return <Navigate to="/" replace />;
  return children;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public / landing routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      {/* Auth routes */}
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

      {/* Dashboard routes (protected) */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<OverviewPage />} />
        <Route path="opportunities" element={<OpportunitiesPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="time-tracking" element={<Navigate to="/dashboard/projects" replace />} />
        <Route path="proposals" element={<ProposalsPage />} />
        <Route path="proposals/:id" element={<ProposalDetailPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="contracts/:id" element={<ContractDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Public proposal / contract signing (no auth) */}
      <Route path="/proposals/:token" element={<ProposalViewPage />} />
      <Route path="/contracts/:token" element={<ContractSignPage />} />

      {/* Portal routes */}
      <Route path="/portal/login/:token" element={<PortalLoginPage />} />
      <Route path="/portal" element={<PortalRoute><PortalHomePage /></PortalRoute>} />
      <Route path="/portal/projects/:id" element={<PortalRoute><PortalProjectPage /></PortalRoute>} />
      <Route path="/portal/invoices/:id" element={<PortalRoute><PortalInvoicePage /></PortalRoute>} />

      {/* Direct dashboard aliases */}
      <Route path="/clients" element={<Navigate to="/dashboard/clients" replace />} />
      <Route path="/projects" element={<Navigate to="/dashboard/projects" replace />} />
      <Route path="/proposals" element={<Navigate to="/dashboard/proposals" replace />} />
      <Route path="/contracts" element={<Navigate to="/dashboard/contracts" replace />} />
      <Route path="/invoices" element={<Navigate to="/dashboard/invoices" replace />} />
      <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PortalProvider>
            <AppRoutes />
            <ToastHost />
          </PortalProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
