import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contractsApi } from '../../api/contracts.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import { ArrowLeft, Send, Trash2, ExternalLink, Copy, CheckCircle } from 'lucide-react';

const STATUS_BADGE = { draft: 'default', sent: 'info', signed: 'success', rejected: 'danger' };

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    contractsApi.get(id)
      .then(res => setContract(res.data?.data?.contract || res.data?.contract || res.data))
      .catch(() => { toast.error('Contract not found'); navigate('/dashboard/contracts'); })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  async function handleSend() {
    setSendLoading(true);
    try {
      const res = await contractsApi.send(id);
      setContract(res.data?.data?.contract || res.data?.contract || res.data);
      setShowLinkModal(true);
      toast.success('Contract sent for signature');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send contract');
    } finally {
      setSendLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await contractsApi.delete(id);
      toast.success('Contract deleted');
      navigate('/dashboard/contracts');
    } catch {
      toast.error('Failed to delete contract');
    } finally {
      setDeleteLoading(false);
    }
  }

  const publicLink = contract?.publicToken
    ? `${window.location.origin}/contracts/${contract.publicToken}`
    : null;

  if (loading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>;
  if (!contract) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/contracts')} className="p-1.5 rounded-lg text-text-muted hover:bg-subtle"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{contract.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={STATUS_BADGE[contract.status] || 'default'}>{contract.status}</Badge>
              <span className="text-sm text-text-muted">{contract.client?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {contract.status === 'draft' && (
            <>
              <Button size="sm" variant="primary" loading={sendLoading} onClick={handleSend}><Send className="w-3.5 h-3.5 mr-1" />Send for Signature</Button>
              <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </>
          )}
          {publicLink && (
            <Button size="sm" variant="secondary" onClick={() => setShowLinkModal(true)}><ExternalLink className="w-3.5 h-3.5 mr-1" />Signing Link</Button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        {[
          { label: 'Client', value: contract.client?.name },
          { label: 'Sent', value: contract.sentAt ? new Date(contract.sentAt).toLocaleDateString('en-IN') : '—' },
          { label: 'Signed', value: contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('en-IN') : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-border rounded-lg p-3">
            <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
            <p className="font-medium text-text-primary mt-0.5">{value || '—'}</p>
          </div>
        ))}
      </div>

      {/* Signature info */}
      {contract.status === 'signed' && (
        <Card>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-success">Contract Signed</p>
              <p className="text-sm text-text-secondary mt-0.5">
                Signed by <strong>{contract.signerName || contract.signature?.signerName}</strong> on {new Date(contract.signedAt || contract.signature?.signedAt).toLocaleDateString('en-IN')}
              </p>
              {(contract.signatureImageUrl || contract.signature?.imageData) && (
                <div className="mt-3">
                  <p className="text-xs text-text-muted mb-1">Signature:</p>
                  <div className="border border-border rounded-lg p-2 bg-subtle inline-block">
                    <img src={contract.signatureImageUrl || contract.signature?.imageData} alt="Client signature" className="max-h-24 max-w-xs" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Contract body */}
      <Card>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Contract Content</h2>
        <div className="max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary leading-relaxed">{contract.body}</pre>
        </div>
      </Card>

      {/* Link modal */}
      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="Contract Signing Link">
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Share this link with your client to review and sign the contract:</p>
          {publicLink ? (
            <>
              <div className="flex gap-2">
                <input readOnly value={publicLink} className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-subtle font-mono text-xs" />
                <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(publicLink); toast.success('Copied!'); }}><Copy className="w-4 h-4" /></Button>
              </div>
              <a href={publicLink} target="_blank" rel="noreferrer" className="block text-center text-sm text-accent hover:underline">Open signing page →</a>
            </>
          ) : (
            <p className="text-sm text-text-muted">Send the contract first.</p>
          )}
          <Button variant="primary" className="w-full" onClick={() => setShowLinkModal(false)}>Close</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} loading={deleteLoading} title="Delete Contract" message="Delete this contract?" />
    </div>
  );
}
