import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { proposalsApi } from '../../api/proposals.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';

const STATUS_BADGE = {
  draft: 'default', sent: 'info', accepted: 'success', rejected: 'danger', expired: 'warning',
};

function BrandHeader() {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">F</span>
      </div>
      <span className="font-bold text-text-primary text-lg">FreelanceHub</span>
    </div>
  );
}

export default function ProposalViewPage() {
  const { token } = useParams();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDone, setActionDone] = useState(null); // 'accepted' | 'rejected'
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  useEffect(() => {
    proposalsApi.getPublic(token)
      .then(res => setProposal(res.data?.data?.proposal || res.data?.proposal || res.data))
      .catch(() => setError('Proposal not found or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setActionLoading(true);
    try {
      await proposalsApi.accept(token);
      setActionDone('accepted');
      setProposal(p => ({ ...p, status: 'accepted' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept proposal.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    setActionLoading(true);
    try {
      await proposalsApi.reject(token);
      setActionDone('rejected');
      setProposal(p => ({ ...p, status: 'rejected' }));
      setShowRejectConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to decline proposal.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-page py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <BrandHeader />

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-danger font-medium mb-2">Not Found</p>
            <p className="text-text-secondary text-sm mb-4">{error}</p>
            <Link to="/" className="text-sm text-accent hover:underline">← Back to FreelanceHub</Link>
          </div>
        )}

        {proposal && !error && (
          <div className="space-y-6">
            {/* Status banner */}
            {(proposal.status === 'accepted' || actionDone === 'accepted') && (
              <div className="bg-success-soft border border-success/20 rounded-xl p-4 text-center">
                <p className="font-semibold text-success">✓ You have accepted this proposal.</p>
                <p className="text-sm text-text-secondary mt-1">The freelancer will be in touch with next steps.</p>
              </div>
            )}
            {(proposal.status === 'rejected' || actionDone === 'rejected') && (
              <div className="bg-danger-soft border border-danger/20 rounded-xl p-4 text-center">
                <p className="font-semibold text-danger">Proposal Declined</p>
                <p className="text-sm text-text-secondary mt-1">This proposal has been declined.</p>
              </div>
            )}
            {proposal.status === 'expired' && (
              <div className="bg-warning-soft border border-warning/20 rounded-xl p-4 text-center">
                <p className="font-semibold text-warning">This proposal has expired.</p>
              </div>
            )}

            {/* Proposal card */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-text-primary">{proposal.title}</h1>
                    {proposal.freelancer && (
                      <p className="text-sm text-text-muted mt-1">From: <strong>{proposal.freelancer.businessName || proposal.freelancer.name}</strong></p>
                    )}
                    {proposal.client && (
                      <p className="text-sm text-text-muted">To: <strong>{proposal.client.name}</strong></p>
                    )}
                  </div>
                  <Badge variant={STATUS_BADGE[proposal.status] || 'default'}>{proposal.status}</Badge>
                </div>
                {(proposal.validUntil || proposal.expiresAt) && proposal.status === 'sent' && (
                  <p className="text-xs text-text-muted mt-3">
                    Valid until: {new Date(proposal.validUntil || proposal.expiresAt).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
              <div className="p-6">
                <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary leading-relaxed">
                  {proposal.scope || proposal.body}
                </pre>
              </div>
            </div>

            {/* Actions (only if 'sent') */}
            {proposal.status === 'sent' && !actionDone && (
              <div className="flex gap-3 justify-center">
                <Button
                  variant="primary"
                  loading={actionLoading}
                  onClick={handleAccept}
                  className="px-8"
                >
                  Accept Proposal
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectConfirm(true)}
                  className="text-danger border-danger hover:bg-danger-soft"
                >
                  Decline
                </Button>
              </div>
            )}

            <p className="text-center text-xs text-text-muted">
              Powered by <Link to="/" className="text-accent hover:underline">FreelanceHub</Link>
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showRejectConfirm}
        onClose={() => setShowRejectConfirm(false)}
        onConfirm={handleReject}
        loading={actionLoading}
        title="Decline Proposal"
        message="Are you sure you want to decline this proposal?"
      />
    </div>
  );
}
