import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { proposalsApi } from '../../api/proposals.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import { ArrowLeft, Send, Trash2, Edit2, Save, X, Copy, ExternalLink } from 'lucide-react';

const STATUS_BADGE = {
  draft: 'default', sent: 'info', accepted: 'success', rejected: 'danger', expired: 'warning',
};

export default function ProposalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    proposalsApi.get(id)
      .then(res => {
        const p = res.data?.data?.proposal || res.data?.proposal || res.data?.data || res.data;
        setProposal(p);
        setEditForm({ title: p.title, body: p.scope || p.body || '' });
      })
      .catch(() => { toast.error('Proposal not found'); navigate('/dashboard/proposals'); })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  async function handleSend() {
    setSendLoading(true);
    try {
      const res = await proposalsApi.send(id);
      const p = res.data?.data?.proposal || res.data?.proposal || res.data;
      setProposal(p);
      setShowLinkModal(true);
      toast.success('Proposal sent');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send proposal');
    } finally {
      setSendLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await proposalsApi.delete(id);
      toast.success('Proposal deleted');
      navigate('/dashboard/proposals');
    } catch {
      toast.error('Failed to delete proposal');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSaveEdit() {
    setSaveLoading(true);
    try {
      const res = await proposalsApi.update(id, {
        title: editForm.title,
        scope: editForm.body || editForm.scope,
      });
      const p = res.data?.data?.proposal || res.data?.proposal || res.data;
      setProposal(p);
      setEditing(false);
      toast.success('Proposal updated');
    } catch {
      toast.error('Failed to update proposal');
    } finally {
      setSaveLoading(false);
    }
  }

  const publicLink = proposal?.publicToken
    ? `${window.location.origin}/proposals/${proposal.publicToken}`
    : null;

  if (loading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>;
  if (!proposal) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/proposals')} className="p-1.5 rounded-lg text-text-muted hover:bg-subtle"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            {editing ? (
              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="text-xl font-bold border-b-2 border-accent focus:outline-none bg-transparent" />
            ) : (
              <h1 className="text-xl font-bold text-text-primary">{proposal.title}</h1>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={STATUS_BADGE[proposal.status] || 'default'}>{proposal.status}</Badge>
              <span className="text-sm text-text-muted">{proposal.client?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {editing ? (
            <>
              <Button size="sm" variant="primary" loading={saveLoading} onClick={handleSaveEdit}><Save className="w-3.5 h-3.5 mr-1" />Save</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></Button>
            </>
          ) : (
            <>
              {proposal.status === 'draft' && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(true)}><Edit2 className="w-3.5 h-3.5 mr-1" />Edit</Button>
                  <Button size="sm" variant="primary" loading={sendLoading} onClick={handleSend}><Send className="w-3.5 h-3.5 mr-1" />Send</Button>
                  <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </>
              )}
              {publicLink && (
                <Button size="sm" variant="secondary" onClick={() => setShowLinkModal(true)}><ExternalLink className="w-3.5 h-3.5 mr-1" />View Link</Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        {[
          { label: 'Client', value: proposal.client?.name },
          { label: 'Valid for', value: `${proposal.validDays} days` },
          { label: 'Sent', value: proposal.sentAt ? new Date(proposal.sentAt).toLocaleDateString('en-IN') : '—' },
          { label: 'Expires', value: proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('en-IN') : (proposal.expiresAt ? new Date(proposal.expiresAt).toLocaleDateString('en-IN') : '—') },
          { label: 'Created', value: new Date(proposal.createdAt).toLocaleDateString('en-IN') },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-border rounded-lg p-3">
            <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
            <p className="font-medium text-text-primary mt-0.5">{value || '—'}</p>
          </div>
        ))}
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Proposal Content</h2>
        {editing ? (
          <textarea value={editForm.body} onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))} rows={16}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none font-mono" />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary leading-relaxed">{proposal.scope || proposal.body}</pre>
        )}
      </Card>

      {/* Link modal */}
      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="Proposal Link">
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Share this link with your client to view and respond to the proposal:</p>
          {publicLink ? (
            <>
              <div className="flex gap-2">
                <input readOnly value={publicLink} className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-subtle font-mono text-xs" />
                <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(publicLink); toast.success('Copied!'); }}><Copy className="w-4 h-4" /></Button>
              </div>
              <a href={publicLink} target="_blank" rel="noreferrer" className="block text-center text-sm text-accent hover:underline">Open proposal page →</a>
            </>
          ) : (
            <p className="text-sm text-text-muted">Send the proposal first to generate a link.</p>
          )}
          <Button variant="primary" className="w-full" onClick={() => setShowLinkModal(false)}>Close</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} loading={deleteLoading} title="Delete Proposal" message="Delete this proposal?" />
    </div>
  );
}
