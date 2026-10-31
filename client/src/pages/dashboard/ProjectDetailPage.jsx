import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { projectsApi } from '../../api/projects.js';
import { tasksApi } from '../../api/tasks.js';
import { timeApi } from '../../api/timeEntries.js';
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
import {
  ArrowLeft, Edit2, Save, X, Plus, GripVertical, Trash2,
  CheckSquare, Clock, MessageSquare, LayoutGrid, Info,
  Send, Play, Square, Timer, TrendingUp, Check, CheckCircle2,
  DollarSign, Calendar,
} from 'lucide-react';

const STATUS_BADGE = {
  active: 'success', completed: 'info', on_hold: 'warning', cancelled: 'danger',
};

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '0h 00m';
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatINR(paise) {
  if (paise == null || isNaN(paise)) return '₹0';
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Sortable Task Card ──────────────────────────────────────────────────────
function SortableTaskCard({ task, onDelete, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isThisCardDragging } = useSortable({ id: task._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isThisCardDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-surface border border-border rounded-lg p-3 flex items-start gap-2 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{task.title}</p>
        {task.description && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{task.description}</p>
        )}
      </div>
      <button
        onClick={() => onDelete(task)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-danger transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Kanban Column ───────────────────────────────────────────────────────────
function KanbanColumn({ col, tasks, onAddTask, onDeleteTask }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onAddTask(col.id, title.trim());
      setTitle('');
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 min-w-[220px] max-w-xs bg-subtle rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{col.label}</span>
        <Badge variant="default">{tasks.length}</Badge>
      </div>

      <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[40px]">
          {tasks.map(t => (
            <SortableTaskCard key={t._id} task={t} onDelete={onDeleteTask} />
          ))}
        </div>
      </SortableContext>

      {adding ? (
        <div className="flex flex-col gap-1 mt-1">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Task title..."
            className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex gap-1">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 py-1 text-xs bg-accent text-white rounded-lg disabled:opacity-50"
            >
              {saving ? '...' : 'Add'}
            </button>
            <button
              onClick={() => { setAdding(false); setTitle(''); }}
              className="px-2 py-1 text-xs border border-border rounded-lg text-text-muted"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-accent py-1 px-2 rounded-lg hover:bg-surface transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add task
        </button>
      )}
    </div>
  );
}

// ─── Messages Tab ────────────────────────────────────────────────────────────
function MessagesTab({ projectId }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await projectsApi.getMessages(projectId);
      const list = res.data?.data?.messages || res.data?.messages || (Array.isArray(res.data?.data) ? res.data.data : []);
      setMessages(list);
    } catch {}
  }, [projectId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await projectsApi.sendMessage(projectId, { body: content.trim() });
      setContent('');
      fetchMessages();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-3 p-1 mb-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(m => (
            <div key={m._id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {(m.senderName || m.sender?.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-text-primary">{m.senderName || m.sender?.name || 'User'}</span>
                  <span className="text-xs text-text-muted">{new Date(m.sentAt || m.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-sm text-text-secondary mt-0.5 whitespace-pre-wrap">{m.body || m.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-border pt-3">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <Button type="submit" variant="primary" size="sm" loading={sending}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

// ─── Time Tracking Tab (Integrated) ──────────────────────────────────────────
function TimeTab({ project, tasks = [], onEntriesChanged }) {
  const { showToast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Timer State
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerNote, setTimerNote] = useState('');
  const [timerTask, setTimerTask] = useState('');
  const [timerBillable, setTimerBillable] = useState(true);
  const [startingTimer, setStartingTimer] = useState(false);
  const [stoppingTimer, setStoppingTimer] = useState(false);

  // Manual Entry Form State
  const [manualForm, setManualForm] = useState({
    date: todayStr(),
    hours: 1,
    minutes: 0,
    taskId: '',
    note: '',
    billable: true,
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualErrors, setManualErrors] = useState({});

  // Filter state
  const [filterBillable, setFilterBillable] = useState('all');

  // Edit Modal State
  const [editTarget, setEditTarget] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [editBillable, setEditBillable] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const timerIntervalRef = useRef(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await timeApi.list({ project: project._id, limit: 100 });
      const list = res.data?.data?.entries || res.data?.entries || (Array.isArray(res.data?.data) ? res.data.data : []);
      setEntries(list);
    } catch {
      showToast('Failed to load time entries', 'error');
    } finally {
      setLoading(false);
    }
  }, [project._id]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Check for active timer
  useEffect(() => {
    timeApi.activeTimer()
      .then(res => {
        const entry = res.data?.data?.entry || res.data?.entry;
        if (entry && (entry.project?._id === project._id || entry.project === project._id)) {
          setActiveTimer(entry);
          const secs = Math.floor((Date.now() - new Date(entry.startedAt).getTime()) / 1000);
          setElapsed(Math.max(0, secs));
          setTimerNote(entry.note || '');
          setTimerBillable(entry.billable !== false);
        }
      })
      .catch(() => {});
  }, [project._id]);

  // Tick interval for active timer
  useEffect(() => {
    if (activeTimer) {
      timerIntervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [activeTimer]);

  // Timer controls
  const handleStartTimer = async () => {
    setStartingTimer(true);
    try {
      const res = await timeApi.startTimer({
        project: project._id,
        task: timerTask || undefined,
        note: timerNote.trim() || undefined,
        billable: timerBillable,
      });
      const entry = res.data?.data?.entry || res.data?.entry;
      setActiveTimer(entry);
      setElapsed(0);
      showToast('Timer started for ' + (project.title || 'project'), 'success');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to start timer', 'error');
    } finally {
      setStartingTimer(false);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    setStoppingTimer(true);
    try {
      await timeApi.stopTimer(activeTimer._id);
      setActiveTimer(null);
      setElapsed(0);
      setTimerNote('');
      showToast('Timer stopped & time entry logged!', 'success');
      fetchEntries();
      if (onEntriesChanged) onEntriesChanged();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to stop timer', 'error');
    } finally {
      setStoppingTimer(false);
    }
  };

  // Manual entry submission
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const hrs = Number(manualForm.hours) || 0;
    const mins = Number(manualForm.minutes) || 0;
    if (hrs === 0 && mins === 0) {
      setManualErrors({ duration: 'Please enter at least 1 minute' });
      return;
    }
    setManualErrors({});
    setManualLoading(true);

    try {
      const baseDate = manualForm.date ? new Date(manualForm.date) : new Date();
      baseDate.setHours(9, 0, 0, 0);
      const durMs = (hrs * 60 + mins) * 60000;
      const endDate = new Date(baseDate.getTime() + Math.max(durMs, 60000));

      await timeApi.create({
        projectId: project._id,
        taskId: manualForm.taskId || undefined,
        startedAt: baseDate.toISOString(),
        endedAt: endDate.toISOString(),
        note: manualForm.note.trim() || undefined,
        billable: manualForm.billable,
      });

      showToast('Time entry added', 'success');
      setManualForm({
        date: todayStr(),
        hours: 1,
        minutes: 0,
        taskId: '',
        note: '',
        billable: true,
      });
      fetchEntries();
      if (onEntriesChanged) onEntriesChanged();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to add time entry', 'error');
    } finally {
      setManualLoading(false);
    }
  };

  const handleOpenEdit = (entry) => {
    setEditTarget(entry);
    setEditNote(entry.note || entry.description || '');
    setEditBillable(entry.billable !== false);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await timeApi.update(editTarget._id, {
        note: editNote.trim(),
        billable: editBillable,
      });
      showToast('Time entry updated', 'success');
      setEditTarget(null);
      fetchEntries();
      if (onEntriesChanged) onEntriesChanged();
    } catch {
      showToast('Failed to update entry', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await timeApi.delete(deleteTarget._id);
      showToast('Time entry deleted', 'success');
      setDeleteTarget(null);
      fetchEntries();
      if (onEntriesChanged) onEntriesChanged();
    } catch {
      showToast('Failed to delete entry', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalMinutes = entries.reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const billableMinutes = entries.filter(e => e.billable).reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const invoicedMinutes = entries.filter(e => e.invoiced).reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const unbilledMinutes = Math.max(0, billableMinutes - invoicedMinutes);
  const estimatedPaise = project.billingType === 'hourly' && project.hourlyRate
    ? Math.round((billableMinutes / 60) * project.hourlyRate)
    : 0;

  const filteredEntries = entries.filter(e => {
    if (filterBillable === 'billable') return e.billable;
    if (filterBillable === 'non_billable') return !e.billable;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Total Tracked</p>
            <p className="text-lg font-bold text-text">{formatDuration(totalMinutes)}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Billable Time</p>
            <p className="text-lg font-bold text-text">{formatDuration(billableMinutes)}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Unbilled Time</p>
            <p className="text-lg font-bold text-text">{formatDuration(unbilledMinutes)}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">
              {project.billingType === 'hourly' ? 'Billable Value' : 'Entries'}
            </p>
            <p className="text-lg font-bold text-text">
              {project.billingType === 'hourly' ? formatINR(estimatedPaise) : `${entries.length} logs`}
            </p>
          </div>
        </Card>
      </div>

      {/* Tracker Controls: Live Stopwatch & Manual Log Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Stopwatch Card */}
        <Card className="p-5 flex flex-col justify-between border-2 border-border/80">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-text text-base">Live Stopwatch Timer</h3>
              </div>
              {activeTimer && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Recording
                </span>
              )}
            </div>

            {/* Big Timer Display */}
            <div className="bg-surface-subtle/80 rounded-xl p-6 text-center mb-4 border border-border/50">
              <span className="font-mono text-4xl sm:text-5xl font-extrabold tracking-wider text-text">
                {formatElapsed(elapsed)}
              </span>
              <p className="text-xs text-text-muted mt-1">
                {activeTimer ? 'Timer is running actively...' : 'Ready to track your work'}
              </p>
            </div>

            {/* Timer inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">What are you working on?</label>
                <input
                  type="text"
                  value={timerNote}
                  onChange={e => setTimerNote(e.target.value)}
                  disabled={!!activeTimer}
                  placeholder="e.g., Implementing dashboard charts or review..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-75"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                {tasks.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">Associated Task</label>
                    <select
                      value={timerTask}
                      onChange={e => setTimerTask(e.target.value)}
                      disabled={!!activeTimer}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-75"
                    >
                      <option value="">General Project Work</option>
                      {tasks.map(t => (
                        <option key={t._id} value={t._id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="timer-billable"
                    checked={timerBillable}
                    onChange={e => setTimerBillable(e.target.checked)}
                    disabled={!!activeTimer}
                    className="w-4 h-4 rounded text-accent focus:ring-accent cursor-pointer"
                  />
                  <label htmlFor="timer-billable" className="text-sm font-medium text-text cursor-pointer">
                    Billable Time
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border">
            {activeTimer ? (
              <Button
                variant="danger"
                onClick={handleStopTimer}
                loading={stoppingTimer}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                Stop & Save Timer
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleStartTimer}
                loading={startingTimer}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Timer
              </Button>
            )}
          </div>
        </Card>

        {/* Manual Time Entry Card */}
        <Card className="p-5 flex flex-col justify-between border-2 border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text text-base">Manual Time Entry</h3>
            </div>

            <form onSubmit={handleManualSubmit} id="manual-time-form" className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Date *</label>
                  <input
                    type="date"
                    value={manualForm.date}
                    onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Associated Task</label>
                  <select
                    value={manualForm.taskId}
                    onChange={e => setManualForm(f => ({ ...f, taskId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">General Project Work</option>
                    {tasks.map(t => (
                      <option key={t._id} value={t._id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Duration *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={manualForm.hours}
                      onChange={e => setManualForm(f => ({ ...f, hours: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent text-center"
                    />
                    <span className="text-xs text-text-muted font-medium">hrs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="5"
                      value={manualForm.minutes}
                      onChange={e => setManualForm(f => ({ ...f, minutes: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent text-center"
                    />
                    <span className="text-xs text-text-muted font-medium">mins</span>
                  </div>
                </div>
                {manualErrors.duration && (
                  <p className="text-xs text-danger mt-1">{manualErrors.duration}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Description / Note</label>
                <input
                  type="text"
                  value={manualForm.note}
                  onChange={e => setManualForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Summary of work completed..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="manual-billable"
                  checked={manualForm.billable}
                  onChange={e => setManualForm(f => ({ ...f, billable: e.target.checked }))}
                  className="w-4 h-4 rounded text-accent focus:ring-accent cursor-pointer"
                />
                <label htmlFor="manual-billable" className="text-sm font-medium text-text cursor-pointer">
                  Mark as Billable
                </label>
              </div>
            </form>
          </div>

          <div className="mt-5 pt-3 border-t border-border">
            <Button
              type="submit"
              form="manual-time-form"
              variant="secondary"
              loading={manualLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log Time Entry
            </Button>
          </div>
        </Card>
      </div>

      {/* History / Logged Entries Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text">Logged Time History</h3>
            <p className="text-xs text-text-muted">{entries.length} total entries recorded for this project</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterBillable('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterBillable === 'all' ? 'bg-accent text-white' : 'bg-surface border border-border text-text-secondary'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterBillable('billable')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterBillable === 'billable' ? 'bg-accent text-white' : 'bg-surface border border-border text-text-secondary'}`}
            >
              Billable
            </button>
            <button
              onClick={() => setFilterBillable('non_billable')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterBillable === 'non_billable' ? 'bg-accent text-white' : 'bg-surface border border-border text-text-secondary'}`}
            >
              Non-Billable
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-surface rounded-xl border border-dashed border-border p-8 text-center">
            <Clock className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-text">No time entries recorded yet</p>
            <p className="text-xs text-text-muted mt-1">Start the live stopwatch or use the manual logger above to record time.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
            {filteredEntries.map(e => (
              <div
                key={e._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-subtle/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-text text-sm truncate">
                      {e.note || e.description || 'Project Work'}
                    </p>
                    {e.task && (
                      <Badge variant="neutral" className="text-[10px]">
                        {e.task?.title || 'Task'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(e.startedAt || e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>·</span>
                    <span>Source: {e.source || 'manual'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    {e.billable ? (
                      <Badge variant="success">Billable</Badge>
                    ) : (
                      <Badge variant="neutral">Non-billable</Badge>
                    )}
                    {e.invoiced ? (
                      <Badge variant="info">Invoiced</Badge>
                    ) : (
                      <Badge variant="warning">Unbilled</Badge>
                    )}
                  </div>

                  <span className="font-mono font-bold text-sm text-text min-w-[70px] text-right">
                    {formatDuration(e.durationMinutes)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(e)}
                      className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-subtle transition-colors cursor-pointer"
                      title="Edit note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(e)}
                      className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Entry Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Time Entry">
        {editTarget && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Description / Note</label>
              <textarea
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-billable"
                checked={editBillable}
                onChange={e => setEditBillable(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent cursor-pointer"
              />
              <label htmlFor="edit-billable" className="text-sm font-medium text-text cursor-pointer">
                Mark as Billable
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button variant="primary" loading={editLoading} onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Time Entry"
        message="Are you sure you want to delete this logged time entry? This action cannot be undone."
        confirmLabel="Delete Entry"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteEntry}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);
  const [deleteTaskLoading, setDeleteTaskLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchProject = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectsApi.get(id),
        projectsApi.listTasks(id).catch(() => ({ data: { data: { tasks: [] } } })),
      ]);
      const p = projRes.data?.data?.project || projRes.data?.project || projRes.data?.data || projRes.data;
      setProject(p);
      const tList = tasksRes.data?.data?.tasks || tasksRes.data?.tasks || p.tasks || [];
      setTasks(tList);
      setEditForm({
        title: p.title || p.name || '',
        description: p.description || '',
        deadline: p.deadline ? p.deadline.slice(0, 10) : '',
        status: p.status,
      });
    } catch {
      toast.error('Project not found');
      navigate('/dashboard/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  async function handleSaveEdit() {
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.deadline) delete payload.deadline;
      const res = await projectsApi.update(id, payload);
      const p = res.data?.data?.project || res.data?.project || res.data;
      setProject(p);
      setEditing(false);
      toast.success('Project updated');
    } catch {
      toast.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTask(status, title) {
    try {
      const res = await projectsApi.createTask(id, { title, status });
      const task = res.data?.data?.task || res.data?.task || res.data;
      setTasks(prev => [...prev, task]);
    } catch {
      toast.error('Failed to add task');
    }
  }

  async function handleDeleteTask() {
    if (!deleteTaskTarget) return;
    setDeleteTaskLoading(true);
    try {
      await tasksApi.delete(deleteTaskTarget._id);
      setTasks(prev => prev.filter(t => t._id !== deleteTaskTarget._id));
      setDeleteTaskTarget(null);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleteTaskLoading(false);
    }
  }

  function handleDragStart({ active }) {
    setActiveId(active.id);
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    // Find which column "over" belongs to
    const overTask = tasks.find(t => t._id === over.id);
    const overCol = COLUMNS.find(c => c.id === over.id);
    const targetStatus = overTask?.status || overCol?.id;
    if (!targetStatus) return;

    const activeTask = tasks.find(t => t._id === active.id);
    if (!activeTask || activeTask.status === targetStatus) return;

    // Optimistic update
    const prev = tasks;
    setTasks(tasks.map(t => t._id === active.id ? { ...t, status: targetStatus } : t));

    try {
      await tasksApi.move(active.id, { status: targetStatus });
    } catch {
      setTasks(prev);
      toast.error('Failed to move task');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!project) return null;

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const colTasks = (colId) => tasks.filter(t => t.status === colId);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'kanban', label: 'Kanban Board', icon: LayoutGrid },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/projects')} className="p-1.5 rounded-lg text-text-muted hover:bg-subtle">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            {editing ? (
              <input
                value={editForm.title || editForm.name || ''}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="text-2xl font-bold border-b-2 border-accent focus:outline-none bg-transparent"
              />
            ) : (
              <h1 className="text-2xl font-bold text-text-primary">{project.title || project.name}</h1>
            )}
            {project.client && (
              <p className="text-sm text-text-muted mt-0.5">
                <Link to={`/dashboard/clients/${project.client._id}`} className="hover:text-accent">{project.client.name}</Link>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_BADGE[project.status] || 'default'}>{project.status?.replace('_', ' ')}</Badge>
          {editing ? (
            <>
              <Button size="sm" variant="primary" loading={saving} onClick={handleSaveEdit}><Save className="w-3.5 h-3.5 mr-1" />Save</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}><Edit2 className="w-3.5 h-3.5 mr-1" />Edit</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
              ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'}`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Project Details</h2>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Deadline</label>
                      <input type="date" value={editForm.deadline} onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Status</label>
                      <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <dl className="space-y-3 text-sm">
                  {project.description && (
                    <div>
                      <dt className="text-text-muted text-xs uppercase tracking-wide">Description</dt>
                      <dd className="text-text-secondary mt-0.5">{project.description}</dd>
                    </div>
                  )}
                  {project.deadline && (
                    <div>
                      <dt className="text-text-muted text-xs uppercase tracking-wide">Deadline</dt>
                      <dd className="text-text-primary mt-0.5">{new Date(project.deadline).toLocaleDateString('en-IN')}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-text-muted text-xs uppercase tracking-wide">Created</dt>
                    <dd className="text-text-primary mt-0.5">{new Date(project.createdAt).toLocaleDateString('en-IN')}</dd>
                  </div>
                </dl>
              )}
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Progress</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Tasks completed</span>
                  <span className="font-semibold">{done}/{total}</span>
                </div>
                <div className="w-full h-2 bg-subtle rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-text-muted text-right">{pct}% complete</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                {COLUMNS.map(col => (
                  <div key={col.id} className="bg-subtle rounded-lg p-2">
                    <p className="text-lg font-bold text-text-primary">{colTasks(col.id).length}</p>
                    <p className="text-xs text-text-muted">{col.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Time Tracking Overview Card */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold text-text-primary">Time Tracking</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('time')}
                  className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                >
                  Open Tracker &rarr;
                </button>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Total tracked:</span>
                  <span className="font-semibold text-text-primary">{formatDuration(project.trackedMinutes || 0)}</span>
                </div>
                {project.billingType === 'hourly' && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Hourly rate:</span>
                    <span className="font-medium text-text-primary">{formatINR(project.hourlyRate)}/hr</span>
                  </div>
                )}
                {project.billingType === 'fixed' && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Fixed price:</span>
                    <span className="font-medium text-text-primary">{formatINR(project.fixedPrice)}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                col={col}
                tasks={colTasks(col.id)}
                onAddTask={handleAddTask}
                onDeleteTask={setDeleteTaskTarget}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="bg-surface border border-accent rounded-lg p-3 shadow-md text-sm opacity-90">
                {tasks.find(t => t._id === activeId)?.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {tab === 'time' && <TimeTab project={project} tasks={tasks} onEntriesChanged={fetchProject} />}
      {tab === 'messages' && <MessagesTab projectId={id} />}

      {/* Delete Task Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={handleDeleteTask}
        loading={deleteTaskLoading}
        title="Delete Task"
        message={`Delete task "${deleteTaskTarget?.title}"?`}
      />
    </div>
  );
}
