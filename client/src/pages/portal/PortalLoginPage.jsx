import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { portalApi } from '../../api/portal.js';
import { usePortal } from '../../context/PortalContext.jsx';

export default function PortalLoginPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { refreshClient } = usePortal();
  const [error, setError] = useState(null);

  useEffect(() => {
    portalApi.login(token)
      .then(async (res) => {
        const sessionToken = res.data?.data?.sessionToken || res.data?.sessionToken;
        if (sessionToken) {
          localStorage.setItem('fh_portal_token', sessionToken);
        }
        if (refreshClient) {
          await refreshClient();
        }
        navigate('/portal', { replace: true });
      })
      .catch(() => setError('Invalid or expired link. Please request a new portal link from your freelancer.'));
  }, [token, navigate, refreshClient]);

  if (error) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-surface border border-border rounded-xl p-8 text-center">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold">F</span>
          </div>
          <h1 className="font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-sm text-text-secondary mb-4">{error}</p>
          <Link to="/" className="text-sm text-accent hover:underline">← Back to FreelanceHub</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-text-muted">Logging you in...</p>
      </div>
    </div>
  );
}
