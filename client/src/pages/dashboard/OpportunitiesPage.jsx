import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { opportunitiesApi } from '../../api/opportunities.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import {
  Briefcase, Building2, Search, Plus, Send, CheckCircle2,
  FileText, Calendar, IndianRupee, ArrowRight, UserCheck, Eye
} from 'lucide-react';

const FIELDS = [
  'All Fields',
  'Web Development',
  'Content Writing & Copywriting',
  'UI/UX & Graphic Design',
  'Mobile App Development',
  'Digital Marketing & SEO',
  'Video Editing & Animation',
  'Data Science & AI',
  'Virtual Assistance',
  'Other',
];

function formatINR(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);
}

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeField, setActiveField] = useState('All Fields');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('explore'); // 'explore' | 'my_posts'

  // Apply modal
  const [applyTarget, setApplyTarget] = useState(null);
  const [applyNote, setApplyNote] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  // Post modal (for companies)
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    field: 'Web Development',
    budget: '',
    description: '',
  });
  const [postLoading, setPostLoading] = useState(false);

  // My posts (for companies)
  const [myPosts, setMyPosts] = useState([]);
  const [viewApplicantsTarget, setViewApplicantsTarget] = useState(null);

  const isCompany = user?.role === 'company';

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeField !== 'All Fields') params.field = activeField;
      if (search.trim()) params.search = search.trim();

      const res = await opportunitiesApi.list(params);
      const list = res.data?.data?.opportunities || res.data?.opportunities || [];
      setOpportunities(list);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, [activeField, search]);

  const fetchMyPosts = useCallback(async () => {
    try {
      const res = await opportunitiesApi.my();
      const list = res.data?.data?.opportunities || res.data?.opportunities || [];
      setMyPosts(list);
    } catch (err) {
      console.error('Failed to load my posted jobs:', err);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  useEffect(() => {
    if (isCompany) {
      fetchMyPosts();
    }
  }, [isCompany, fetchMyPosts]);

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
      fetchOpportunities();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit application');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.description.trim() || !postForm.budget) {
      toast.error('Please fill all required fields');
      return;
    }

    setPostLoading(true);
    try {
      await opportunitiesApi.create({
        title: postForm.title.trim(),
        field: postForm.field,
        budget: Number(postForm.budget),
        description: postForm.description.trim(),
      });
      toast.success('Opportunity posted successfully!');
      setShowPostModal(false);
      setPostForm({ title: '', field: 'Web Development', budget: '', description: '' });
      fetchOpportunities();
      fetchMyPosts();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to post opportunity');
    } finally {
      setPostLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">New Opportunities</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Discover roles and projects directly posted by hiring companies
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCompany && (
            <Button variant="primary" onClick={() => setShowPostModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Post Job Opportunity
            </Button>
          )}
        </div>
      </div>

      {/* Tabs if company */}
      {isCompany && (
        <div className="flex border-b border-border gap-4">
          <button
            onClick={() => setTab('explore')}
            className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === 'explore'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            All Open Opportunities ({opportunities.length})
          </button>
          <button
            onClick={() => setTab('my_posts')}
            className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === 'my_posts'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            My Job Postings ({myPosts.length})
          </button>
        </div>
      )}

      {tab === 'explore' && (
        <>
          {/* Filters & Search */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by role, company name, or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Field Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {FIELDS.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveField(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full shrink-0 transition-colors ${
                    activeField === f
                      ? 'bg-accent text-white'
                      : 'bg-surface border border-border text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunities List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : opportunities.length === 0 ? (
            <Card className="text-center py-12">
              <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-text mb-1">No opportunities found</h3>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                {search || activeField !== 'All Fields'
                  ? 'No matching jobs for this search filter. Try clearing your search.'
                  : 'Companies will appear here as soon as they sign up and post opportunities.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map(opp => (
                <Card key={opp._id} className="flex flex-col justify-between hover:border-accent transition-colors gap-4">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-accent font-semibold mb-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{opp.companyName}</span>
                        </div>
                        <h2 className="text-lg font-bold text-text">{opp.title}</h2>
                      </div>
                      <Badge variant="success" className="text-sm font-semibold shrink-0">
                        {formatINR(opp.budget)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent-soft text-accent">
                        {opp.field}
                      </span>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(opp.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <p className="text-sm text-text-secondary whitespace-pre-line line-clamp-3">
                      {opp.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      Posted by {opp.companyName}
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setApplyTarget(opp)}
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" /> Quick Apply
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: My Job Postings (Companies) */}
      {tab === 'my_posts' && (
        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <Card className="text-center py-12">
              <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-text mb-1">No postings yet</h3>
              <p className="text-sm text-text-muted mb-4">You have not posted any opportunities yet.</p>
              <Button variant="primary" onClick={() => setShowPostModal(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Post Your First Opportunity
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {myPosts.map(post => (
                <Card key={post._id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold text-text">{post.title}</h2>
                        <Badge variant="success">{formatINR(post.budget)}</Badge>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent-soft text-accent">
                          {post.field}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{post.description}</p>
                      <p className="text-xs text-text-muted">
                        Posted on {new Date(post.createdAt).toLocaleDateString('en-IN')} ·{' '}
                        <strong>{post.applicants?.length || 0} applicant(s)</strong>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setViewApplicantsTarget(post)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> View Applicants ({post.applicants?.length || 0})
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apply Modal */}
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
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Applicant Details</p>
              <div className="p-3 bg-surface border border-border rounded-lg text-sm space-y-1">
                <p><strong className="text-text">Name:</strong> <span className="text-text-secondary">{user?.name}</span></p>
                <p><strong className="text-text">Email:</strong> <span className="text-text-secondary">{user?.email}</span></p>
                {user?.field && (
                  <p><strong className="text-text">Field:</strong> <span className="text-text-secondary">{user.field}</span></p>
                )}
              </div>
            </div>

            {/* Resume indicator */}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Attached Resume</p>
              {user?.resumeUrl ? (
                <div className="flex items-center gap-2 p-3 bg-accent-soft border border-accent/20 rounded-lg text-accent text-sm">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="font-medium truncate">{user.resumeFileName || 'Resume.pdf'}</span>
                  <CheckCircle2 className="w-4 h-4 ml-auto text-success shrink-0" />
                </div>
              ) : (
                <div className="p-3 bg-surface border border-border rounded-lg text-xs text-text-muted">
                  No resume uploaded in profile. Your profile details will be submitted.
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Note / Cover Message to Client (Optional)
              </label>
              <textarea
                rows={3}
                value={applyNote}
                onChange={(e) => setApplyNote(e.target.value)}
                placeholder="Why are you a good fit for this role? Share relevant past projects or portfolio links..."
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

      {/* Post Opportunity Modal (Companies) */}
      <Modal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        title="Post New Job Opportunity"
      >
        <form onSubmit={handleCreateOpportunity} className="space-y-4">
          <Input
            label="Role You Want to Hire *"
            name="title"
            value={postForm.title}
            onChange={(e) => setPostForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Senior Frontend Developer, SEO Copywriter"
            required
          />

          <div>
            <label className="block text-sm font-medium text-text mb-1">Field / Category *</label>
            <select
              value={postForm.field}
              onChange={(e) => setPostForm(f => ({ ...f, field: e.target.value }))}
              className="w-full px-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {FIELDS.filter(f => f !== 'All Fields').map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Budget / Pay Amount (₹ INR) *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted text-sm font-medium">₹</span>
              <input
                type="number"
                min="100"
                step="100"
                value={postForm.budget}
                onChange={(e) => setPostForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="e.g. 45000"
                className="w-full pl-8 pr-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Job Description *</label>
            <textarea
              rows={4}
              value={postForm.description}
              onChange={(e) => setPostForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe scope of work, deliverables, and requirements..."
              className="w-full px-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowPostModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={postLoading}>
              Post Opportunity
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Applicants Modal (Companies) */}
      <Modal
        isOpen={!!viewApplicantsTarget}
        onClose={() => setViewApplicantsTarget(null)}
        title={`Applicants for ${viewApplicantsTarget?.title || ''}`}
      >
        {viewApplicantsTarget && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {viewApplicantsTarget.applicants?.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No candidates have applied yet.</p>
            ) : (
              viewApplicantsTarget.applicants.map((app, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg bg-surface space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-text">{app.freelancerName}</p>
                      <p className="text-xs text-text-muted">{app.freelancerEmail}</p>
                    </div>
                    {app.field && <Badge variant="neutral">{app.field}</Badge>}
                  </div>

                  {app.note && (
                    <div className="bg-surface-subtle p-2.5 rounded text-xs text-text-secondary">
                      <p className="font-medium text-text mb-0.5">Applicant Note:</p>
                      <p>{app.note}</p>
                    </div>
                  )}

                  {app.resumeUrl && (
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={app.resumeUrl}
                        download={app.resumeFileName || 'resume.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent font-medium hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" /> Download {app.resumeFileName || 'Resume'}
                      </a>
                      <span className="text-xs text-text-muted">
                        Applied {new Date(app.appliedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
