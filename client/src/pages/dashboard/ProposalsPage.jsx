import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalsApi } from '../../api/proposals.js';
import { clientsApi } from '../../api/clients.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { SkeletonTable } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { FileText, Plus, Eye, Trash2 } from 'lucide-react';

const LIMIT = 20;
const STATUS_TABS = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'];
const STATUS_BADGE = {
  draft: 'default', sent: 'info', accepted: 'success', rejected: 'danger', expired: 'warning',
};

export default function ProposalsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ clientId: '', title: '', scope: '', price: 0, validDays: 30 });
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (clientFilter) params.clientId = clientFilter;
      const res = await proposalsApi.list(params);
      const list = res.data?.data?.proposals || res.data?.proposals || (Array.isArray(res.data?.data) ? res.data.data : []);
      setProposals(list);
      const count = res.data?.meta?.pagination?.total ?? res.data?.total ?? list.length;
      setTotal(count);
    } catch (err) {
      console.error('Failed to load proposals:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, clientFilter]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);
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
    if (!form.scope.trim()) errs.scope = 'Proposal scope required';
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    setFormLoading(true);
    try {
      const now = new Date();
      const validUntil = new Date(now.getTime() + (Number(form.validDays) || 30) * 86400000).toISOString();
      const payload = {
        clientId: form.clientId,
        title: form.title.trim(),
        scope: form.scope.trim(),
        price: Math.round((Number(form.price) || 0) * 100), // paise
        validUntil,
      };
      const res = await proposalsApi.create(payload);
      toast.success('Proposal created');
      setShowModal(false);
      const p = res.data?.data?.proposal || res.data?.proposal || res.data;
      navigate(`/dashboard/proposals/${p._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create proposal');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await proposalsApi.delete(deleteTarget._id);
      toast.success('Proposal deleted');
      setDeleteTarget(null);
      fetchProposals();
    } catch {
      toast.error('Failed to delete proposal');
    } finally {
      setDeleteLoading(false);
    }
  }

  const proposalsList = Array.isArray(proposals) ? proposals : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Proposals</h1>
          <p className="text-text-secondary text-sm mt-0.5">Send professional proposals to win clients</p>
        </div>
        <Button variant="primary" onClick={() => { setForm({ clientId: '', title: '', scope: '', price: 0, validDays: 30 }); setFormErrors({}); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1.5" />New Proposal
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

      {loading ? <SkeletonTable /> : proposalsList.length === 0 ? (
        <EmptyState icon={FileText} title="No proposals" description="Create a proposal to start winning clients." action={<Button variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-1.5" />New Proposal</Button>} />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-subtle">
              <tr>{['Title', 'Client', 'Status', 'Sent', 'Expires', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {proposalsList.map(p => (
                <tr key={p._id} className="hover:bg-subtle/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{p.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.client?.name || '—'}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_BADGE[p.status] || 'default'}>{p.status}</Badge></td>
                  <td className="px-4 py-3 text-text-muted">{p.sentAt ? new Date(p.sentAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-IN') : (p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('en-IN') : '—')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/dashboard/proposals/${p._id}`)} className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-subtle transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      {p.status === 'draft' && <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > LIMIT && <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Proposal">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Website Design Proposal" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Price (₹)</label>
              <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Valid for (days)</label>
              <input type="number" min="1" value={form.validDays} onChange={e => setForm(f => ({ ...f, validDays: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Proposal Scope / Content *</label>
            <textarea value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} rows={6} placeholder="Describe project scope, deliverables, timeline..." className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none font-mono" />
            {formErrors.scope && <p className="text-xs text-danger mt-1">{formErrors.scope}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={formLoading}>Create Proposal</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading} title="Delete Proposal" message={`Delete proposal "${deleteTarget?.title}"?`} />
    </div>
  );
}
