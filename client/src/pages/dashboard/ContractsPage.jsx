import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractsApi } from '../../api/contracts.js';
import { clientsApi } from '../../api/clients.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { SkeletonTable } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { FileSignature, Plus, Eye, Trash2 } from 'lucide-react';

const LIMIT = 20;
const STATUS_TABS = ['all', 'draft', 'sent', 'signed', 'rejected'];
const STATUS_BADGE = { draft: 'default', sent: 'info', signed: 'success', rejected: 'danger' };

export default function ContractsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ clientId: '', title: '', body: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (clientFilter) params.clientId = clientFilter;
      const res = await contractsApi.list(params);
      const list = res.data?.data?.contracts || res.data?.contracts || (Array.isArray(res.data?.data) ? res.data.data : []);
      setContracts(list);
      const count = res.data?.meta?.pagination?.total ?? res.data?.total ?? list.length;
      setTotal(count);
    } catch {
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, clientFilter, toast]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);
  useEffect(() => {
    clientsApi.list({ limit: 100 })
      .then(r => {
        const list = r.data?.data?.clients || r.data?.clients || (Array.isArray(r.data?.data) ? r.data.data : []);
        setClients(list);
      })
      .catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const errs = {};
    if (!form.clientId) errs.clientId = 'Client required';
    if (!form.title.trim()) errs.title = 'Title required';
    if (!form.body.trim()) errs.body = 'Contract body required';
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    setFormLoading(true);
    try {
      const res = await contractsApi.create(form);
      toast.success('Contract created');
      setShowModal(false);
      const c = res.data?.data?.contract || res.data?.contract || res.data;
      navigate(`/dashboard/contracts/${c._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create contract');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await contractsApi.delete(deleteTarget._id);
      toast.success('Contract deleted');
      setDeleteTarget(null);
      fetchContracts();
    } catch {
      toast.error('Failed to delete contract');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Contracts</h1>
          <p className="text-text-secondary text-sm mt-0.5">Create and send contracts for e-signature</p>
        </div>
        <Button variant="primary" onClick={() => { setForm({ clientId: '', title: '', body: '' }); setFormErrors({}); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1.5" />New Contract
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex border border-border rounded-lg overflow-hidden">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'text-text-muted hover:bg-subtle'}`}>
              {s}
            </button>
          ))}
        </div>
        <select value={clientFilter} onChange={e => { setClientFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <SkeletonTable /> : contracts.length === 0 ? (
        <EmptyState icon={FileSignature} title="No contracts" description="Create a contract and send it for e-signature." action={<Button variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-1.5" />New Contract</Button>} />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-subtle">
              <tr>{['Title', 'Client', 'Status', 'Sent', 'Signed', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contracts.map(c => (
                <tr key={c._id} className="hover:bg-subtle/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{c.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.client?.name || '—'}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_BADGE[c.status] || 'default'}>{c.status}</Badge></td>
                  <td className="px-4 py-3 text-text-muted">{c.sentAt ? new Date(c.sentAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{c.signedAt ? new Date(c.signedAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/dashboard/contracts/${c._id}`)} className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-subtle"><Eye className="w-3.5 h-3.5" /></button>
                      {c.status === 'draft' && <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger-soft"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > LIMIT && <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Contract">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Freelance Service Agreement" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
            {formErrors.title && <p className="text-xs text-danger mt-1">{formErrors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Client *</label>
            <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">Select client...</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {formErrors.clientId && <p className="text-xs text-danger mt-1">{formErrors.clientId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Contract Body *</label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={10} placeholder="Enter the full contract text..." className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none font-mono" />
            {formErrors.body && <p className="text-xs text-danger mt-1">{formErrors.body}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={formLoading}>Create Contract</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading} title="Delete Contract" message={`Delete contract "${deleteTarget?.title}"?`} />
    </div>
  );
}
