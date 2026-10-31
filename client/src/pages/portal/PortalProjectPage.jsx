import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { portalApi } from '../../api/portal.js';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import { ArrowLeft, Send } from 'lucide-react';

const TASK_STATUS_BADGE = { todo: 'default', in_progress: 'info', review: 'warning', done: 'success' };
const PROJECT_STATUS_BADGE = { active: 'success', completed: 'info', on_hold: 'warning', cancelled: 'danger' };

export default function PortalProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    portalApi.getProject(id)
      .then(res => setData(res.data?.data?.project || res.data?.project || res.data?.data || res.data))
      .catch(() => navigate('/portal'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await portalApi.getMessages(id);
      setMessages(res.data?.data?.messages || res.data?.messages || (Array.isArray(res.data?.data) ? res.data.data : []));
    } catch {}
  }, [id]);

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
      await portalApi.sendMessage(id, { body: content.trim() });
      setContent('');
      fetchMessages();
    } catch {}
    finally { setSending(false); }
  }

  if (loading) return <div className="min-h-screen bg-page p-8"><SkeletonCard /></div>;
  if (!data) return null;

  const project = data.project || data;
  const tasks = data.tasks || project?.tasks || [];
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="min-h-screen bg-page">
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/portal" className="p-1.5 rounded-lg text-text-muted hover:bg-subtle"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-text-primary">Client Portal</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{project?.title || project?.name}</h1>
            {project?.description && <p className="text-sm text-text-secondary mt-1">{project.description}</p>}
          </div>
          <Badge variant={PROJECT_STATUS_BADGE[project?.status] || 'default'}>{project?.status?.replace('_', ' ')}</Badge>
        </div>

        {/* Progress */}
        <Card>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-muted">Progress</span>
            <span className="font-semibold">{done}/{total} tasks complete ({pct}%)</span>
          </div>
          <div className="w-full h-2 bg-subtle rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </Card>

        {/* Tasks */}
        <Card>
          <h2 className="text-sm font-semibold text-text-primary mb-4">Tasks</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'todo', label: 'To Do' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'review', label: 'Review' },
              { id: 'done', label: 'Done' },
            ].map(col => (
              <div key={col.id}>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{col.label} ({tasksByStatus[col.id].length})</p>
                <div className="space-y-1.5">
                  {tasksByStatus[col.id].map(t => (
                    <div key={t._id} className="flex items-center gap-1.5 p-2 bg-subtle rounded-lg">
                      <Badge variant={TASK_STATUS_BADGE[t.status] || 'default'} className="w-1.5 h-1.5 rounded-full p-0 flex-shrink-0" />
                      <span className="text-xs text-text-secondary">{t.title}</span>
                    </div>
                  ))}
                  {tasksByStatus[col.id].length === 0 && (
                    <p className="text-xs text-text-muted italic">None</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Messages */}
        <Card>
          <h2 className="text-sm font-semibold text-text-primary mb-4">Messages</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No messages yet.</p>
            ) : (
              messages.map(m => (
                <div key={m._id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {(m.senderName || m.sender?.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold">{m.senderName || m.sender?.name || 'User'}</span>
                      <span className="text-xs text-text-muted">{new Date(m.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap mt-0.5">{m.body || m.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="flex gap-2 border-t border-border pt-3">
            <input value={content} onChange={e => setContent(e.target.value)} placeholder="Type a message..."
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
            <Button type="submit" variant="primary" size="sm" loading={sending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
