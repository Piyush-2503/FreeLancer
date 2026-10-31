import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/projects.js';
import { clientsApi } from '../../api/clients.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { FolderKanban, Plus, Search, Calendar, CheckSquare, Trash2, Clock } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_BADGE = {
  active: 'success',
  completed: 'info',
  archived: 'neutral',
  on_hold: 'warning',
  cancelled: 'danger',
};

const LIMIT = 12;

function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();
  const total = project.taskProgress?.total ?? project.totalTasks ?? 0;
  const done = project.taskProgress?.done ?? project.completedTasks ?? 0;
  const pct = project.taskProgress?.percent ?? (total > 0 ? Math.round((done / total) * 100) : 0);
  const title = project.title || project.name || 'Untitled Project';
  const clientName = project.client?.name || project.clientName || '';

  return (
    <Card className="flex flex-col gap-3 cursor-pointer hover:border-accent transition-colors"
      onClick={() => navigate(`/dashboard/projects/${project._id}`)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate">{title}</p>
          {clientName && (
            <p className="text-xs text-text-muted mt-0.5">{clientName}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Badge variant={STATUS_BADGE[project.status] || 'default'}>
            {project.status?.replace('_', ' ')}
          </Badge>
          <button
            className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
            onClick={e => { e.stopPropagation(); onDelete(project); }}
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-text-secondary line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{done}/{total} tasks</span>
        </div>
        <div className="flex items-center gap-1 text-accent font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {project.trackedMinutes
              ? `${Math.floor(project.trackedMinutes / 60)}h ${String(project.trackedMinutes % 60).padStart(2, '0')}m`
              : '0h 00m'}
          </span>
        </div>
        {project.deadline && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(project.deadline).toLocaleDateString('en-IN')}</span>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

const INIT_FORM = { title: '', client: '', description: '', deadline: '', status: 'active' };

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const searchTimer = useRef(null);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      const res = await projectsApi.list(params);
      const list = res.data?.data?.projects || res.data?.projects || (Array.isArray(res.data?.data) ? res.data.data : []);
      setProjects(list);
      const count = res.data?.meta?.pagination?.total ?? res.data?.total ?? list.length;
      setTotal(count);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    clientsApi.list({ limit: 100 })
      .then(res => {
        const list = res.data?.data?.clients || res.data?.clients || (Array.isArray(res.data?.data) ? res.data.data : []);
        setClients(list);
      })
      .catch(() => {});
  }, []);

  function validateForm() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Project title is required';
    if (!form.client) errs.client = 'Client is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        client: form.client,
        description: form.description?.trim() || undefined,
        status: form.status,
      };
      if (form.deadline) payload.deadline = form.deadline;
      const res = await projectsApi.create(payload);
      toast.success('Project created');
      setShowModal(false);
      setForm(INIT_FORM);
      const newProj = res.data?.data?.project || res.data?.project || res.data;
      navigate(`/dashboard/projects/${newProj._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create project');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await projectsApi.delete(deleteTarget._id);
      toast.success('Project deleted');
      setDeleteTarget(null);
      fetchProjects(page, search, statusFilter);
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeleteLoading(false);
    }
  }

  const clientOptions = [
    { value: '', label: 'Select client...' },
    ...clients.map(c => ({ value: c._id, label: c.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-text-secondary text-sm mt-0.5">Manage your freelance projects</p>
        </div>
        <Button variant="primary" onClick={() => { setForm(INIT_FORM); setFormErrors({}); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to get started."
          action={
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> New Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard key={p._id} project={p} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {total > LIMIT && (
        <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      )}

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Project Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            error={formErrors.title}
            placeholder="e.g. Website Redesign"
            required
          />
          <Select
            label="Client"
            options={clientOptions}
            value={form.client}
            onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
            error={formErrors.client}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Brief project description..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
          <Input
            label="Deadline (optional)"
            type="date"
            value={form.deadline}
            onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS.slice(1, 4)}
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={formLoading}>Create Project</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.title || deleteTarget?.name}"? This will also delete associated tasks and messages.`}
      />
    </div>
  );
}
