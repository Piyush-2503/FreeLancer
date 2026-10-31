import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard.js';
import { opportunitiesApi } from '../../api/opportunities.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import {
  Users, FolderKanban, Receipt, Clock,
  TrendingUp, AlertCircle, CheckCircle, Briefcase,
  Building2, Send, ArrowRight, FileText, CheckCircle2
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color = 'text-accent', subtext }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

function formatINR(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);
}

export default function OverviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [opportunities, setOpportunities] = useState([]);
  const [oppsLoading, setOppsLoading] = useState(true);

  // Quick apply modal
  const [applyTarget, setApplyTarget] = useState(null);
  const [applyNote, setApplyNote] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    dashboardApi.getSummary()
      .then(res => setSummary(res.data?.data || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    opportunitiesApi.list({ limit: 4 })
      .then(res => {
        const list = res.data?.data?.opportunities || res.data?.opportunities || [];
        setOpportunities(list);
      })
      .catch(() => {})
      .finally(() => setOppsLoading(false));
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyTarget) return;

    setApplyLoading(true);
    try {
      await opportunitiesApi.apply(applyTarget._id, {
        note: applyNote,
        resumeUrl: user?.resumeUrl,
        resumeFileName: user?.resumeFileName || 'Resume.pdf',
      });
      toast.success(`Application sent to ${applyTarget.companyName}!`);
      setApplyTarget(null);
      setApplyNote('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit application');
    } finally {
      setApplyLoading(false);
    }
  };

  const stats = summary ? [
    { label: 'Total Clients', value: summary.totalClients, icon: Users, color: 'text-accent' },
    { label: 'Active Projects', value: summary.activeProjects, icon: FolderKanban, color: 'text-text' },
    { label: 'Completed Projects', value: summary.completedProjects, icon: CheckCircle, color: 'text-success' },
    { label: 'Outstanding', value: formatINR(summary.outstandingAmount), icon: Receipt, color: 'text-warning', subtext: `${summary.overdueCount} overdue` },
    { label: 'Paid This Month', value: formatINR(summary.paidThisMonth), icon: TrendingUp, color: 'text-success' },
    { label: 'Hours This Week', value: `${summary.hoursThisWeek}h`, icon: Clock, color: 'text-text' },
  ] : [];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-text">Overview</h1>
            <p className="text-text-muted text-sm">
              Welcome back, {user?.name}! Here is your business at a glance.
            </p>
          </div>
          {user?.role === 'freelancer' && user?.field && (
            <Badge variant="info" className="self-start sm:self-auto">
              Freelancer: {user.field}
            </Badge>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      )}

      {/* NEW OPPORTUNITIES FROM COMPANIES */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-accent" /> New Opportunities from Companies
            </h2>
            <p className="text-text-muted text-xs">Direct hiring opportunities posted by companies looking for freelancers</p>
          </div>
          <Link
            to="/dashboard/opportunities"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            View All Opportunities <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {oppsLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : opportunities.length === 0 ? (
          <Card className="text-center py-8">
            <Briefcase className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-text">No active job opportunities yet</p>
            <p className="text-xs text-text-muted mt-0.5">When companies sign up and post jobs, they will appear right here.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {opportunities.map(opp => (
              <Card key={opp._id} className="flex flex-col justify-between hover:border-accent transition-colors gap-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="text-xs font-semibold text-accent flex items-center gap-1 mb-0.5">
                        <Building2 className="w-3 h-3" /> {opp.companyName}
                      </span>
                      <h3 className="font-bold text-text text-base">{opp.title}</h3>
                    </div>
                    <Badge variant="success" className="font-semibold text-xs shrink-0">
                      {formatINR(opp.budget)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent-soft text-accent">
                      {opp.field}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(opp.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary line-clamp-2">
                    {opp.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-text-muted">Direct Company Hire</span>
                  <Button size="sm" variant="primary" onClick={() => setApplyTarget(opp)}>
                    <Send className="w-3 h-3 mr-1" /> Quick Apply
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Analytical Cards */}
      <div className="grid lg:grid-cols-2 gap-6 pt-2">
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" /> Revenue Trend
          </h3>
          <div className="h-40 flex items-center justify-center bg-surface-subtle rounded-input">
            <p className="text-sm text-text-muted">Track your monthly earnings and projected income</p>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" /> Outstanding Invoices
          </h3>
          <div className="h-40 flex items-center justify-center bg-surface-subtle rounded-input">
            <p className="text-sm text-text-muted">{summary?.overdueCount || 0} overdue invoices pending payment</p>
          </div>
        </Card>
      </div>

      {/* Quick Apply Modal */}
      <Modal
        isOpen={!!applyTarget}
        onClose={() => setApplyTarget(null)}
        title={`Apply to ${applyTarget?.companyName || ''}`}
      >
        {applyTarget && (
          <form onSubmit={handleApply} className="space-y-4">
            <div className="p-3 bg-surface-subtle border border-border rounded-lg">
              <p className="text-xs text-text-muted uppercase tracking-wide">Role Applied For</p>
              <p className="text-base font-bold text-text">{applyTarget.title}</p>
              <p className="text-xs text-accent mt-0.5 font-medium">Budget: {formatINR(applyTarget.budget)}</p>
            </div>

            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Your Profile</p>
              <div className="p-3 bg-surface border border-border rounded-lg text-sm space-y-1">
                <p><strong className="text-text">Name:</strong> <span className="text-text-secondary">{user?.name}</span></p>
                <p><strong className="text-text">Email:</strong> <span className="text-text-secondary">{user?.email}</span></p>
                {user?.field && (
                  <p><strong className="text-text">Specialization:</strong> <span className="text-text-secondary">{user.field}</span></p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Resume / CV</p>
              {user?.resumeUrl ? (
                <div className="flex items-center gap-2 p-3 bg-accent-soft border border-accent/20 rounded-lg text-accent text-sm">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="font-medium truncate">{user.resumeFileName || 'Resume.pdf'}</span>
                  <CheckCircle2 className="w-4 h-4 ml-auto text-success shrink-0" />
                </div>
              ) : (
                <div className="p-3 bg-surface border border-border rounded-lg text-xs text-text-muted">
                  Your profile details will be submitted. You can update your resume in Settings anytime.
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Note to Client (Optional)
              </label>
              <textarea
                rows={3}
                value={applyNote}
                onChange={(e) => setApplyNote(e.target.value)}
                placeholder="Briefly state your experience or why you are a great match..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => setApplyTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={applyLoading}>
                <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Application
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
