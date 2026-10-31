import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { User, Building2, Percent, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    businessName: user?.businessName || '',
    address: user?.address || '',
    gstin: user?.gstin || '',
    upiId: user?.upiId || '',
    defaultTaxRate: user?.defaultTaxRate ?? 18,
    defaultPaymentTermsDays: user?.defaultPaymentTermsDays ?? 30,
  });

  const handleChange = e => {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(form);
      showToast('Settings saved', 'success');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-text-muted text-sm">Manage your profile and business details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <h2 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Personal Information
          </h2>
          <div className="space-y-3">
            <Input
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
            <div>
              <label className="text-sm text-text-muted block mb-1">Email</label>
              <p className="text-sm text-text px-3 py-2 bg-surface-subtle rounded-input border border-border">
                {user?.email}
              </p>
              <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Business Details
          </h2>
          <div className="space-y-3">
            <Input label="Business Name" name="businessName" value={form.businessName} onChange={handleChange} />
            <Input label="Address" name="address" value={form.address} onChange={handleChange} />
            <Input label="GSTIN" name="gstin" value={form.gstin} onChange={handleChange} placeholder="e.g. 29ABCDE1234F1Z5" />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Percent className="w-4 h-4" /> Invoice Defaults
          </h2>
          <div className="space-y-3">
            <Input
              label="Default Tax Rate (%)"
              name="defaultTaxRate"
              type="number"
              min="0"
              max="100"
              value={form.defaultTaxRate}
              onChange={handleChange}
            />
            <Input
              label="Default Payment Terms (days)"
              name="defaultPaymentTermsDays"
              type="number"
              min="0"
              max="365"
              value={form.defaultPaymentTermsDays}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payment Details
          </h2>
          <Input
            label="UPI ID"
            name="upiId"
            value={form.upiId}
            onChange={handleChange}
            placeholder="yourname@upi"
            helper="Used for manual payment instructions on invoices"
          />
        </Card>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
