import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoicesApi } from '../../api/invoices.js';
import { clientsApi } from '../../api/clients.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { SkeletonTable } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Receipt, Plus, X, Eye } from 'lucide-react';

const LIMIT = 20;

const STATUS_TABS = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'];
const STATUS_BADGE = {
  draft: 'default', sent: 'info', paid: 'success', overdue: 'danger', cancelled: 'default',
};

function formatINR(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100);
}

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: '' };

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ clientId: '', items: [{ ...EMPTY_ITEM }], taxRate: 18, paymentTermsDays: 30, notes: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (clientFilter) params.clientId = clientFilter;
      const res = await invoicesApi.list(params);
      const list = res.data?.data?.invoices || res.data?.invoices || (Array.isArray(res.data?.data) ? res.data.data : []);
      setInvoices(list);
      const count = res.data?.meta?.pagination?.total ?? res.data?.total ?? list.length;
      setTotal(count);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, clientFilter, toast]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  useEffect(() => {
    clientsApi.list({ limit: 100 })
      .then(r => {
        const list = r.data?.data?.clients || r.data?.clients || (Array.isArray(r.data?.data) ? r.data.data : []);
        setClients(list);
      })
      .catch(() => {});
  }, []);

  function calcTotals() {
    const subtotal = form.items.reduce((s, i) => s + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0);
    const tax = Math.round(subtotal * (Number(form.taxRate) || 0) / 100);
    return { subtotal, tax, total: subtotal + tax };
  }

  async function handleCreate(e) {
    e.preventDefault();
    const errs = {};
    if (!form.clientId) errs.clientId = 'Client is required';
    if (form.items.some(i => !i.description.trim())) errs.items = 'All items need a description';
    if (form.items.some(i => Number(i.unitPrice) <= 0)) errs.items = 'All items need a price > 0';
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setFormLoading(true);
    try {
      const now = new Date();
      const termsDays = Number(form.paymentTermsDays) || 30;
      const dueDate = new Date(now.getTime() + termsDays * 86400000);

      const lineItems = form.items.map(i => {
        const qty = Number(i.quantity) || 1;
        const unitPricePaise = Math.round((Number(i.unitPrice) || 0) * 100);
        return {
          description: i.description.trim(),
          quantity: qty,
          unitPrice: unitPricePaise,
          amount: qty * unitPricePaise,
        };
      });

      const payload = {
        clientId: form.clientId,
        taxRate: Number(form.taxRate) || 0,
        issueDate: now.toISOString(),
        dueDate: dueDate.toISOString(),
        notes: form.notes?.trim() || undefined,
        lineItems,
      };

      const res = await invoicesApi.create(payload);
      toast.success('Invoice created');
      setShowModal(false);
      setForm({ clientId: '', items: [{ ...EMPTY_ITEM }], taxRate: 18, paymentTermsDays: 30, notes: '' });
      const inv = res.data?.data?.invoice || res.data?.invoice || res.data;
      navigate(`/dashboard/invoices/${inv._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    try {
      await invoicesApi.cancel(cancelTarget._id);
      toast.success('Invoice cancelled');
      setCancelTarget(null);
      fetchInvoices();
    } catch {
      toast.error('Failed to cancel invoice');
    } finally {
      setCancelLoading(false);
    }
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  }
  function removeItem(idx) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }
  function updateItem(idx, field, value) {
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));
  }

  const { subtotal, tax, total: grandTotal } = calcTotals();
  const invoicesList = Array.isArray(invoices) ? invoices : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Invoices</h1>
          <p className="text-text-secondary text-sm mt-0.5">Create and manage client invoices</p>
        </div>
        <Button variant="primary" onClick={() => { setForm({ clientId: '', items: [{ ...EMPTY_ITEM }], taxRate: 18, paymentTermsDays: 30, notes: '' }); setFormErrors({}); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1.5" />New Invoice
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex border border-border rounded-lg overflow-hidden">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors
                ${statusFilter === s ? 'bg-primary text-white' : 'text-text-muted hover:bg-subtle'}`}>
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

      {loading ? <SkeletonTable /> : invoicesList.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices" description="Create your first invoice to get paid." action={<Button variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-1.5" />New Invoice</Button>} />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-subtle">
              <tr>{['Invoice #', 'Client', 'Amount', 'Status', 'Due Date', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoicesList.map(inv => {
                const effectiveStatus = inv.effectiveStatus || inv.status || 'draft';
                const totalPaise = inv.total ?? inv.totalAmount ?? 0;
                return (
                  <tr key={inv._id} className={`hover:bg-subtle/50 transition-colors ${effectiveStatus === 'overdue' ? 'bg-danger-soft/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-text-primary font-medium">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-text-secondary">{inv.client?.name || '—'}</td>
                    <td className="px-4 py-3 text-text-primary font-semibold">{formatINR(totalPaise)}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS_BADGE[effectiveStatus] || 'default'}>{effectiveStatus}</Badge></td>
                    <td className="px-4 py-3 text-text-secondary">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/dashboard/invoices/${inv._id}`)} className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-subtle transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                        {(inv.status === 'draft' || inv.status === 'sent') && (
                          <button onClick={() => setCancelTarget(inv)} className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger-soft transition-colors" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > LIMIT && <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />}

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Invoice">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Client *</label>
            <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">Select client...</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {formErrors.clientId && <p className="text-xs text-danger mt-1">{formErrors.clientId}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-primary">Line Items</label>
              <button type="button" onClick={addItem} className="text-xs text-accent hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add Item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-6">
                    <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Description" className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} placeholder="Qty" className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} placeholder="Price (₹)" className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <div className="col-span-1 flex items-center justify-center pt-1.5">
                    {form.items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-text-muted hover:text-danger"><X className="w-4 h-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
            {formErrors.items && <p className="text-xs text-danger mt-1">{formErrors.items}</p>}
          </div>

          <div className="bg-subtle rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{formatINR(subtotal * 100)}</span></div>
            <div className="flex justify-between text-text-secondary"><span>Tax ({form.taxRate}%)</span><span>{formatINR(tax * 100)}</span></div>
            <div className="flex justify-between font-bold text-text-primary border-t border-border pt-1 mt-1"><span>Total</span><span>{formatINR(grandTotal * 100)}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Tax Rate (%)</label>
              <input type="number" min="0" max="100" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Payment Terms (days)</label>
              <input type="number" min="0" value={form.paymentTermsDays} onChange={e => setForm(f => ({ ...f, paymentTermsDays: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={formLoading}>Create Invoice</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel} loading={cancelLoading} title="Cancel Invoice" message={`Cancel invoice ${cancelTarget?.invoiceNumber}?`} />
    </div>
  );
}
