import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Zap, Upload, FileText, CheckCircle2, X, Building2, UserCircle2 } from 'lucide-react';

const FREELANCER_FIELDS = [
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

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'freelancer', // 'freelancer' | 'company'
    // Freelancer fields
    field: 'Web Development',
    resumeUrl: '',
    resumeFileName: '',
    // Company fields
    businessName: '',
    hiringRole: '',
    jobDescription: '',
    budget: '',
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, resume: 'File size must be under 5MB' }));
      return;
    }

    setResumeFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({
        ...f,
        resumeUrl: reader.result,
        resumeFileName: file.name,
      }));
      setErrors(prev => ({ ...prev, resume: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removeResume = () => {
    setResumeFile(null);
    setForm(f => ({ ...f, resumeUrl: '', resumeFileName: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters';

    if (form.role === 'freelancer') {
      if (!form.field) errs.field = 'Please select your field of work';
    } else if (form.role === 'company') {
      if (!form.businessName.trim() && !form.name.trim()) errs.businessName = 'Company name is required';
      if (!form.hiringRole.trim()) errs.hiringRole = 'Please enter the role you want to hire for';
      if (!form.jobDescription.trim()) errs.jobDescription = 'Job description is required';
      if (!form.budget || Number(form.budget) <= 0) errs.budget = 'Please enter the budget amount';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      };

      if (form.role === 'freelancer') {
        payload.field = form.field;
        if (form.resumeUrl) {
          payload.resumeUrl = form.resumeUrl;
          payload.resumeFileName = form.resumeFileName;
        }
      } else {
        payload.businessName = form.businessName.trim() || form.name.trim();
        payload.hiringRole = form.hiringRole.trim();
        payload.field = form.field || 'General';
        payload.jobDescription = form.jobDescription.trim();
        payload.budget = Number(form.budget);
      }

      await register(payload);
      showToast(
        form.role === 'company'
          ? 'Company account created and job opportunity posted!'
          : 'Welcome to FreelanceHub! Your freelancer account is ready.',
        'success'
      );
      navigate('/dashboard');
    } catch (err) {
      const serverErrors = err.response?.data?.error?.details;
      if (serverErrors) {
        const fieldErrors = {};
        serverErrors.forEach(e => {
          const field = e.path.replace('body.', '');
          fieldErrors[field] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        const msg = err.response?.data?.error?.message
          || (err.message && err.message.includes('Network') ? 'Backend server unreachable. Please verify port 5000 is running.' : 'Registration failed. Please try again.');
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            FreelanceHub
          </Link>
        </div>

        <div className="bg-surface rounded-card border border-border p-6 sm:p-8 shadow-card">
          <h1 className="text-2xl font-bold text-text mb-1">Create your account</h1>
          <p className="text-text-muted text-sm mb-6">
            Join as a freelancer to discover work, or as a company to hire top talent.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <Input
              label="Full Name *"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Alex Johnson"
              autoComplete="name"
              required
            />

            <Input
              label="Email Address *"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <Input
              label="Password *"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              required
              helper="At least 8 characters"
            />

            {/* Role Selection Dropdown */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Role of User *
              </label>
              <div className="relative">
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer"
                >
                  <option value="freelancer">Freelancer (Looking for work & managing projects)</option>
                  <option value="company">Company (Hiring freelancers & posting opportunities)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  ▼
                </div>
              </div>
            </div>

            {/* Conditional Block: FREELANCER */}
            {form.role === 'freelancer' && (
              <div className="p-4 bg-surface-subtle border border-border rounded-lg space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                  <UserCircle2 className="w-4 h-4" /> Freelancer Profile Details
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    In which field do you work? *
                  </label>
                  <select
                    name="field"
                    value={form.field}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                  >
                    {FREELANCER_FIELDS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  {errors.field && <p className="text-xs text-danger mt-1">{errors.field}</p>}
                </div>

                {/* Resume Upload */}
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Upload Resume / CV (Optional)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    id="resume-upload"
                  />

                  {!resumeFile ? (
                    <label
                      htmlFor="resume-upload"
                      className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent hover:bg-surface transition-colors"
                    >
                      <Upload className="w-6 h-6 text-accent mb-1" />
                      <span className="text-sm font-medium text-text">Click to upload resume</span>
                      <span className="text-xs text-text-muted mt-0.5">PDF, DOC, DOCX up to 5MB</span>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-surface border border-accent/30 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-5 h-5 text-accent shrink-0" />
                        <div className="truncate">
                          <p className="text-sm font-medium text-text truncate">{resumeFile.name}</p>
                          <p className="text-xs text-text-muted">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <button
                          type="button"
                          onClick={removeResume}
                          className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {errors.resume && <p className="text-xs text-danger mt-1">{errors.resume}</p>}
                </div>
              </div>
            )}

            {/* Conditional Block: COMPANY */}
            {form.role === 'company' && (
              <div className="p-4 bg-surface-subtle border border-border rounded-lg space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                  <Building2 className="w-4 h-4" /> Company & Hiring Details
                </div>

                <Input
                  label="Company / Organization Name"
                  type="text"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  error={errors.businessName}
                  placeholder="e.g. Acme Tech Solutions"
                />

                <Input
                  label="Role you want to hire *"
                  type="text"
                  name="hiringRole"
                  value={form.hiringRole}
                  onChange={handleChange}
                  error={errors.hiringRole}
                  placeholder="e.g. Senior Full-Stack Web Developer, Content Writer"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Field / Category *
                  </label>
                  <select
                    name="field"
                    value={form.field}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                  >
                    {FREELANCER_FIELDS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Amount up to which you pay (Budget in ₹ INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted text-sm font-medium">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="budget"
                      min="100"
                      step="100"
                      value={form.budget}
                      onChange={handleChange}
                      placeholder="e.g. 50000"
                      className="w-full pl-8 pr-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    />
                  </div>
                  {errors.budget && <p className="text-xs text-danger mt-1">{errors.budget}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Job Description *
                  </label>
                  <textarea
                    name="jobDescription"
                    rows={4}
                    value={form.jobDescription}
                    onChange={handleChange}
                    placeholder="Describe the job requirements, responsibilities, timeline, and expectations..."
                    className="w-full px-3 py-2 rounded-input border border-border text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    required
                  />
                  {errors.jobDescription && <p className="text-xs text-danger mt-1">{errors.jobDescription}</p>}
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full mt-4" loading={loading}>
              {form.role === 'company' ? 'Register & Post Opportunity' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
