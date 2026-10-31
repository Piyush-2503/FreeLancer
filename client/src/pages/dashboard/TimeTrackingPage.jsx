import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { timeApi } from '../../api/timeEntries.js';
import { projectsApi } from '../../api/projects.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { SkeletonTable } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Clock, Plus, Square, Edit2, Trash2, Timer, TrendingUp } from 'lucide-react';

const LIMIT = 20;

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—';
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const INIT_FORM = { projectId: '', description: '', date: todayStr(), hours: 1, minutes: 0, billable: true };

export default function TimeTrackingPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId') || '';

  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [stoppingTimer, setStoppingTimer] = useState(false);
  const [startingTimer, setStartingTimer] = useState(false);

  const [filterProject, setFilterProject] = useState(preselectedProjectId);
  const [filterDate, setFilterDate] = useState('');
  const [filterBillable, setFilterBillable] = useState('');

  const [form, setForm] = useState({ ...INIT_FORM, projectId: preselectedProjectId });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const intervalRef = useRef(null);

  useEffect(() => {
    timeApi.activeTimer()
      .then(res => {
        const entry = res.data?.data?.entry || res.data?.entry;
        if (entry) {
          setActiveTimer(entry);
          const secs = Math.floor((Date.now() - new Date(entry.startedAt).getTime()) / 1000);
          setElapsed(Math.max(0, secs));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeTimer]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filterProject) params.project = filterProject;
      if (filterDate) params.from = filterDate;
      const res = await timeApi.list(params);
      const list = res.data?.data?.entries || res.data?.entries || (Array.isArray(res.data?.data) ? res.data.data : []);
      setEntries(list);
      const totalCount = res.data?.meta?.pagination?.total ?? res.data?.total ?? list.length;
      setTotal(totalCount);
    } catch (err) {
      console.error('Failed to load time entries:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterProject, filterDate]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    projectsApi.list({ limit: 100 })
      .then(res => {
        const list = res.data?.data?.projects || res.data?.projects || (Array.isArray(res.data?.data) ? res.data.data : []);
        setProjects(list);
      })
      .catch(() => {});
  }, []);

  async function handleStartTimer() {
    if (!form.projectId) {
      setFormErrors(e => ({ ...e, projectId: 'Select a project to start the timer' }));
      return;
    }
    setStartingTimer(true);
    try {
      const res = await timeApi.startTimer({ project: form.projectId, note: form.description || undefined, billable: form.billable });
      const entry = res.data?.data?.entry || res.data?.entry;
      setActiveTimer(entry);
      setElapsed(0);
      toast.success('Timer started');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to start timer');
    } finally {
      setStartingTimer(false);
    }
  }

  async function handleStopTimer() {
    if (!activeTimer) return;
    setStoppingTimer(true);
    try {
      await timeApi.stopTimer(activeTimer._id);
      setActiveTimer(null);
      setElapsed(0);
      toast.success('Timer stopped');
      fetchEntries();
    } catch {
      toast.error('Failed to stop timer');
    } finally {
      setStoppingTimer(false);
    }
  }

  function validateForm(f) {
    const errs = {};
    if (!f.projectId) errs.projectId = 'Project is required';
    if ((Number(f.hours) || 0) === 0 && (Number(f.minutes) || 0) === 0) errs.duration = 'Enter at least 1 minute';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmitEntry(e) {
    e.preventDefault();
    if (!validateForm(form)) return;
    setFormLoading(true);
    try {
      const baseDate = form.date ? new Date(form.date) : new Date();
      baseDate.setHours(9, 0, 0, 0);
      const durMs = ((Number(form.hours) || 0) * 60 + (Number(form.minutes) || 0)) * 60000;
      const endDate = new Date(baseDate.getTime() + Math.max(durMs, 60000));

      await timeApi.create({
        projectId: form.projectId,
        startedAt: baseDate.toISOString(),
        endedAt: endDate.toISOString(),
        note: form.description || undefined,
        billable: form.billable,
      });
      toast.success('Time entry added');
      setForm({ ...INIT_FORM, projectId: preselectedProjectId });
      setFormErrors({});
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to add entry');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEditSave() {
    setEditLoading(true);
    try {
      await timeApi.update(editTarget._id, {
        note: editForm.note || editForm.description,
        billable: editForm.billable,
      });
      toast.success('Entry updated');
      setEditTarget(null);
      fetchEntries();
    } catch {
      toast.error('Failed to update entry');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await timeApi.delete(deleteTarget._id);
      toast.success('Entry deleted');
      setDeleteTarget(null);
      fetchEntries();
    } catch {
      toast.error('Failed to delete entry');
    } finally {
      setDeleteLoading(false);
    }
  }

  const entriesArray = Array.isArray(entries) ? entries : [];
  const filteredEntries = filterBillable === ''
    ? entriesArray
    : entriesArray.filter(e => String(e.billable) === filterBillable);

  const totalMinutes = entriesArray.reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const billableMinutes = entriesArray.filter(e => e.billable).reduce((s, e) => s + (e.durationMinutes || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Time Tracking</h1>
        <p className="text-text-secondary text-sm mt-0.5">Log and manage your billable hours</p>
      </div>

      {activeTimer && (
        <div className="bg-primary text-white rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Timer className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-white/60">Timer running</p>
              <p className="font-mono text-xl font-bold">{formatElapsed(elapsed)}</p>
              {(activeTimer.project?.title || activeTimer.project?.name) && (
                <p className="text-xs text-white/80">{activeTimer.project.title || activeTimer.project.name}</p>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" loading={stoppingTimer} onClick={handleStopTimer}>
            <Square className="w-4 h-4 mr-1.5" />Stop Timer
          </Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-accent" /><p className="text-xs text-text-muted uppercase tracking-wide">Total</p></div><p className="text-xl font-bold text-text-primary">{formatDuration(totalMinutes)}</p></Card>
        <Card><div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-success" /><p className="text-xs text-text-muted uppercase tracking-wide">Billable</p></div><p className="text-xl font-bold text-success">{formatDuration(billableMinutes)}</p></Card>
        <Card><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-text-muted" /><p className="text-xs text-text-muted uppercase tracking-wide">Non-Billable</p></div><p className="text-xl font-bold text-text-secondary">{formatDuration(totalMinutes - billableMinutes)}</p></Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-text-primary mb-4">Log Time Entry</h2>
        <form onSubmit={handleSubmitEntry} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Project *</label>
              <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">Select project...</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.title || p.name}</option>)}
              </select>
              {formErrors.projectId && <p className="text-xs text-danger mt-1">{formErrors.projectId}</p>}
            </div>
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <Input label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What did you work on?" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Hours</label>
              <input type="number" min="0" max="23" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Minutes</label>
              <input type="number" min="0" max="59" value={form.minutes} onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input type="checkbox" checked={form.billable} onChange={e => setForm(f => ({ ...f, billable: e.target.checked }))} className="w-4 h-4 rounded accent-accent" />
              <span className="text-sm text-text-primary">Billable</span>
            </label>
          </div>
          {formErrors.duration && <p className="text-xs text-danger">{formErrors.duration}</p>}
          <div className="flex justify-end gap-2">
            {!activeTimer && (
              <Button type="button" variant="secondary" loading={startingTimer} onClick={handleStartTimer}>
                <Timer className="w-4 h-4 mr-1.5" />Start Timer
              </Button>
            )}
            <Button type="submit" variant="primary" loading={formLoading}><Plus className="w-4 h-4 mr-1.5" />Add Entry</Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap gap-3">
        <select value={filterProject} onChange={e => { setFilterProject(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.title || p.name}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
        <select value={filterBillable} onChange={e => { setFilterBillable(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">All</option>
          <option value="true">Billable Only</option>
          <option value="false">Non-Billable Only</option>
        </select>
      </div>

      {loading ? <SkeletonTable /> : filteredEntries.length === 0 ? (
        <EmptyState icon={Clock} title="No time entries" description="Log your first time entry above." />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-subtle">
              <tr>
                {['Date', 'Project', 'Description', 'Duration', 'Billable', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntries.map(e => (
                <tr key={e._id} className="hover:bg-subtle/50 transition-colors">
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{new Date(e.startedAt || e.date || e.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-text-primary font-medium">{e.project?.title || e.project?.name || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary max-w-xs truncate">{e.note || e.description || '—'}</td>
                  <td className="px-4 py-3 text-text-primary font-mono whitespace-nowrap">{formatDuration(e.durationMinutes)}</td>
                  <td className="px-4 py-3">{e.billable ? <Badge variant="success">Billable</Badge> : <Badge variant="default">No</Badge>}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditTarget(e); setEditForm({ note: e.note || e.description || '', billable: e.billable }); }}
                        className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-subtle transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(e)} className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > LIMIT && <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />}

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Time Entry">
        <div className="space-y-4">
          <Input label="Description / Note" value={editForm.note || ''} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editForm.billable || false} onChange={e => setEditForm(f => ({ ...f, billable: e.target.checked }))} className="w-4 h-4 rounded accent-accent" />
            <span className="text-sm text-text-primary">Billable</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" loading={editLoading} onClick={handleEditSave}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading} title="Delete Entry" message="Delete this time entry?" />
    </div>
  );
}
