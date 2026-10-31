import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { clientsApi } from '../../api/clients.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Input from '../../components/ui/Input.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import {
  Users, Plus, Search, Trash2, Edit2, RotateCw, Building2,
  Mail, Phone, MapPin, Globe, ChevronDown, ChevronUp, Copy,
  ExternalLink, Check, AlertCircle, ShieldAlert
} from 'lucide-react';

function ClientForm({ initial = {}, onSubmit, loading, onClose }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    phone: initial.phone || '',
    company: initial.company || '',
    address: initial.address || '',
    notes: initial.notes || '',
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(form); }}
      className="space-y-3"
    >
      <Input label="Name *" name="name" value={form.name} onChange={handleChange} required />
      <Input label="Company" name="company" value={form.company} onChange={handleChange} />
      <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
      <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
      <Input label="Address" name="address" value={form.address} onChange={handleChange} />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text">Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          rows={3}
          placeholder="Client preferences, payment terms, or notes..."
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" loading={loading}>
          {initial._id ? 'Save Changes' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ClientCard({ client, onEdit, onDelete, onUpdateClient }) {
  const [expandedPortal, setExpandedPortal] = useState(false);
  const [portalLink, setPortalLink] = useState(null);
  const [portalExpiresAt, setPortalExpiresAt] = useState(client.portalTokenExpiresAt);
  const [portalLoading, setPortalLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const isPortalActive = Boolean(portalExpiresAt && new Date(portalExpiresAt) > new Date());

  const handleGeneratePortal = async (e) => {
    e.stopPropagation();
    setPortalLoading(true);
    try {
      const res = await clientsApi.generatePortalLink(client._id);
      const link = res.data?.data?.link || res.data?.link;
      const expiresAt = res.data?.data?.expiresAt || res.data?.expiresAt;
      setPortalLink(link);
      setPortalExpiresAt(expiresAt);
      showToast('Client portal link generated!', 'success');
    } catch {
      showToast('Failed to generate portal link', 'error');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRevokePortal = async (e) => {
    e.stopPropagation();
    setPortalLoading(true);
    try {
      await clientsApi.revokePortalLink(client._id);
      setPortalLink(null);
      setPortalExpiresAt(null);
      showToast('Client portal access revoked', 'success');
    } catch {
      showToast('Failed to revoke portal access', 'error');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const linkToCopy = portalLink || `${window.location.origin}/portal/login/${client._id}`;
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      showToast('Portal link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Header: Name and Action Icons */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <Link
            to={`/dashboard/clients/${client._id}`}
            className="text-lg font-bold text-text hover:text-accent transition-colors"
          >
            {client.name}
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(client)}
              className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-subtle transition-colors cursor-pointer"
              title="Edit client"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(client)}
              className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
              title="Delete client"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Company Name with Icon */}
        {client.company && (
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-4">
            <Building2 className="w-4 h-4 text-text-muted shrink-0" />
            <span>{client.company}</span>
          </div>
        )}

        {/* Contact Details with Icons */}
        <div className="space-y-2.5 text-sm text-text-secondary mb-4">
          {client.email && (
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-text-muted shrink-0" />
              <a href={`mailto:${client.email}`} className="hover:text-accent hover:underline truncate">
                {client.email}
              </a>
            </div>
          )}

          {client.phone && (
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-text-muted shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}

          {client.address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
              <span className="leading-snug text-xs sm:text-sm">{client.address}</span>
            </div>
          )}
        </div>

        {/* Notes in Subtle Box */}
        {client.notes && (
          <div className="bg-surface-subtle/80 rounded-xl p-3 border border-border/40 text-xs text-text-secondary italic mb-4 leading-relaxed">
            &ldquo;{client.notes}&rdquo;
          </div>
        )}
      </div>

      <div>
        {/* Client Portal Collapsible Accordion */}
        <div className="border-t border-border/50 pt-3">
          <button
            type="button"
            onClick={() => setExpandedPortal(!expandedPortal)}
            className="w-full flex items-center justify-between text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors py-1 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Client Portal</span>
            </div>
            {expandedPortal ? (
              <ChevronUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-emerald-600" />
            )}
          </button>

          {/* Expanded Portal Access Controls */}
          {expandedPortal && (
            <div className="mt-2.5 p-4 rounded-xl bg-emerald-50/20 border border-emerald-100/80 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text">Client Portal Access</h4>
                    <p className="text-[11px] text-text-muted leading-tight mt-0.5">
                      Provide {client.name} self-service access to view projects, pay invoices & sign proposals
                    </p>
                  </div>
                </div>

                {isPortalActive ? (
                  <button
                    type="button"
                    onClick={handleRevokePortal}
                    disabled={portalLoading}
                    className="bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50 shrink-0"
                  >
                    {portalLoading ? '...' : 'Revoke Access'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGeneratePortal}
                    disabled={portalLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50 shrink-0"
                  >
                    {portalLoading ? '...' : 'Generate Access'}
                  </button>
                )}
              </div>

              {/* Status Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted bg-surface/70 px-3 py-2 rounded-lg border border-border/40">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className={`w-2 h-2 rounded-full ${isPortalActive ? 'bg-emerald-500 animate-pulse' : 'bg-text-muted'}`} />
                  <span className={isPortalActive ? 'text-emerald-700 font-semibold' : 'text-text-muted'}>
                    {isPortalActive ? 'Portal link is active' : 'No active portal link'}
                  </span>
                </div>
                {portalExpiresAt && (
                  <div>Expires: {formatDate(portalExpiresAt)}</div>
                )}
                <div>
                  Last viewed by client: {client.lastPortalViewAt ? formatDate(client.lastPortalViewAt) : 'Never'}
                </div>
              </div>

              {/* Shareable Link Box */}
              {(isPortalActive || portalLink) && (
                <div>
                  <p className="text-[11px] font-medium text-text-muted mb-1">
                    Shareable Link (generated once):
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={portalLink || `${window.location.origin}/portal/login/${client._id}`}
                      className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-secondary select-all font-mono truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border bg-surface hover:bg-surface-subtle text-text rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    {portalLink && (
                      <a
                        href={portalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-text-muted hover:text-text border border-border rounded-lg bg-surface transition-colors shrink-0"
                        title="Open portal link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Date Added */}
        <div className="mt-4 pt-3 border-t border-border/40 text-xs text-text-muted">
          Added {formatDate(client.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const fetchClients = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await clientsApi.list({ limit: 100, search });
      const list = res.data?.data?.clients || res.data?.clients || [];
      setClients(list);
      if (isRefresh) showToast('Clients list refreshed', 'success');
    } catch {
      showToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreate = async (data) => {
    setActionLoading(true);
    try {
      await clientsApi.create(data);
      showToast('Client created successfully', 'success');
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to create client', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setActionLoading(true);
    try {
      await clientsApi.update(editClient._id, data);
      showToast('Client updated successfully', 'success');
      setEditClient(null);
      fetchClients();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update client', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await clientsApi.delete(deleteConfirm._id);
      showToast('Client deleted', 'success');
      setDeleteConfirm(null);
      fetchClients();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to delete client', 'error');
      setDeleteConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredClients = clients.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">Clients</h1>
          <p className="text-text-muted text-sm mt-1">
            Manage your client accounts, contacts, and billing profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => fetchClients(true)}
            loading={refreshing}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients by name, company, or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all"
        />
      </div>

      {/* Client Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-surface-subtle rounded w-3/4" />
              <div className="h-4 bg-surface-subtle rounded w-1/2" />
              <div className="space-y-2 pt-2">
                <div className="h-4 bg-surface-subtle rounded w-2/3" />
                <div className="h-4 bg-surface-subtle rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No clients match your search' : 'No clients yet'}
          description={search ? 'Try adjusting your search criteria' : 'Add your first client to create projects, track time, and send invoices.'}
          action={
            search ? (
              <Button variant="secondary" onClick={() => setSearch('')}>Clear Search</Button>
            ) : (
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" /> Add Client
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <ClientCard
              key={client._id}
              client={client}
              onEdit={setEditClient}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Client">
        <ClientForm
          onSubmit={handleCreate}
          loading={actionLoading}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      {/* Edit Client Modal */}
      <Modal open={!!editClient} onClose={() => setEditClient(null)} title="Edit Client">
        {editClient && (
          <ClientForm
            initial={editClient}
            onSubmit={handleUpdate}
            loading={actionLoading}
            onClose={() => setEditClient(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Client"
        message={`Are you sure you want to delete ${deleteConfirm?.name}? Associated projects and invoices will be affected.`}
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
