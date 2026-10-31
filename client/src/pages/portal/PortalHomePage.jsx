import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { portalApi } from '../../api/portal.js';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import { FolderKanban, Receipt, LogOut } from 'lucide-react';

const PROJECT_STATUS_BADGE = { active: 'success', completed: 'info', on_hold: 'warning', cancelled: 'danger' };
const INVOICE_STATUS_BADGE = { draft: 'default', sent: 'info', paid: 'success', overdue: 'danger', cancelled: 'default' };

function formatINR(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100);
}

export default function PortalHomePage() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, projRes, invRes] = await Promise.all([
          portalApi.me(),
          portalApi.getProjects(),
          portalApi.getInvoices(),
        ]);
        setClient(meRes.data?.data?.client || meRes.data?.client);
        setProjects(projRes.data?.data?.projects || projRes.data?.projects || (Array.isArray(projRes.data?.data) ? projRes.data.data : []));
        setInvoices(invRes.data?.data?.invoices || invRes.data?.invoices || (Array.isArray(invRes.data?.data) ? invRes.data.data : []));
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await portalApi.logout();
    } catch {}
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div>
              <span className="font-bold text-text-primary">FreelanceHub</span>
              <span className="text-text-muted text-sm ml-2">Client Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {client && <span className="text-sm text-text-secondary">Welcome, {client.name}</span>}
            <Button variant="secondary" size="sm" loading={logoutLoading} onClick={handleLogout}>
              <LogOut className="w-3.5 h-3.5 mr-1.5" />Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {/* Projects */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-accent" />Projects
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects yet" description="Your freelancer hasn't added any projects yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map(p => {
                const total = p.totalTasks || p.tasks?.length || 0;
                const done = p.completedTasks || p.tasks?.filter(t => t.status === 'done').length || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Card key={p._id} className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-text-primary">{p.name}</p>
                        {p.description && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{p.description}</p>}
                      </div>
                      <Badge variant={PROJECT_STATUS_BADGE[p.status] || 'default'}>{p.status?.replace('_', ' ')}</Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>Progress</span><span>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <Link to={`/portal/projects/${p._id}`}>
                      <Button variant="secondary" size="sm" className="w-full">View Project</Button>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Invoices */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-accent" />Invoices
          </h2>
          {loading ? (
            <SkeletonCard />
          ) : invoices.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices yet" description="Your freelancer hasn't sent any invoices yet." />
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-subtle">
                  <tr>
                    {['Invoice #', 'Amount', 'Status', 'Due Date', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map(inv => (
                    <tr key={inv._id} className={`hover:bg-subtle/50 ${inv.status === 'overdue' ? 'bg-danger-soft/30' : ''}`}>
                      <td className="px-4 py-3 font-mono font-medium text-text-primary">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{formatINR(inv.totalAmount)}</td>
                      <td className="px-4 py-3"><Badge variant={INVOICE_STATUS_BADGE[inv.status] || 'default'}>{inv.status}</Badge></td>
                      <td className="px-4 py-3 text-text-muted">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3"><Link to={`/portal/invoices/${inv._id}`} className="text-xs text-accent hover:underline">View →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
