import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoicesApi } from '../../api/invoices.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import { ArrowLeft, Download, Send, X, Link2, Copy } from 'lucide-react';

const STATUS_BADGE = {
  draft: 'default', sent: 'info', paid: 'success', overdue: 'danger', cancelled: 'default',
};

function formatINR(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100);
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const [sendLoading, setSendLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [payLinkLoading, setPayLinkLoading] = useState(false);
  const [payLinkUrl, setPayLinkUrl] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    invoicesApi.get(id)
      .then(res => {
        const inv = res.data?.data?.invoice || res.data?.invoice || res.data?.data || res.data;
        setInvoice(inv);
      })
      .catch(() => { toast.error('Invoice not found'); navigate('/dashboard/invoices'); })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  async function handleSend() {
    setSendLoading(true);
    try {
      const res = await invoicesApi.send(id);
      const inv = res.data?.data?.invoice || res.data?.invoice || res.data;
      setInvoice(inv);
      toast.success('Invoice sent to client');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send invoice');
    } finally {
      setSendLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    try {
      const res = await invoicesApi.cancel(id);
      const inv = res.data?.data?.invoice || res.data?.invoice || res.data;
      setInvoice(inv);
      setCancelTarget(false);
      toast.success('Invoice cancelled');
    } catch {
      toast.error('Failed to cancel invoice');
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      const res = await invoicesApi.pdf(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  }

  async function handlePaymentLink() {
    setPayLinkLoading(true);
    try {
      const res = await invoicesApi.paymentLink(id);
      const url = res.data.url || res.data.paymentLink?.short_url || res.data.paymentLink?.id;
      setPayLinkUrl(url);
      setInvoice(prev => ({ ...prev, paymentLinkUrl: url }));
      setShowPayModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payment link');
    } finally {
      setPayLinkLoading(false);
    }
  }

  if (loading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>;
  if (!invoice) return null;

  const subtotal = (invoice.items || []).reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/invoices')} className="p-1.5 rounded-lg text-text-muted hover:bg-subtle">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary font-mono">{invoice.invoiceNumber}</h1>
              <Badge variant={STATUS_BADGE[invoice.status] || 'default'}>{invoice.status}</Badge>
            </div>
            <p className="text-sm text-text-muted mt-0.5">{invoice.client?.name}</p>
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="secondary" size="sm" loading={pdfLoading} onClick={handleDownloadPdf}>
            <Download className="w-3.5 h-3.5 mr-1.5" />PDF
          </Button>
          {invoice.status === 'draft' && (
            <Button variant="primary" size="sm" loading={sendLoading} onClick={handleSend}>
              <Send className="w-3.5 h-3.5 mr-1.5" />Send to Client
            </Button>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <Button variant="secondary" size="sm" loading={payLinkLoading} onClick={handlePaymentLink}>
              <Link2 className="w-3.5 h-3.5 mr-1.5" />Payment Link
            </Button>
          )}
          {(invoice.status === 'draft' || invoice.status === 'sent') && (
            <Button variant="danger" size="sm" onClick={() => setCancelTarget(true)}>
              <X className="w-3.5 h-3.5 mr-1.5" />Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Existing payment link */}
      {invoice.paymentLinkUrl && invoice.status !== 'cancelled' && (
        <div className="flex items-center gap-2 p-3 bg-accent-soft rounded-lg border border-accent/20">
          <Link2 className="w-4 h-4 text-accent flex-shrink-0" />
          <a href={invoice.paymentLinkUrl} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline truncate flex-1">
            {invoice.paymentLinkUrl}
          </a>
          <button onClick={() => { navigator.clipboard.writeText(invoice.paymentLinkUrl); toast.success('Copied!'); }}
            className="p-1 text-accent hover:bg-accent/10 rounded">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Invoice Card */}
      <Card>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">From</p>
            <p className="font-semibold text-text-primary">{invoice.freelancer?.businessName || invoice.freelancer?.name}</p>
            {invoice.freelancer?.address && <p className="text-sm text-text-secondary">{invoice.freelancer.address}</p>}
            {invoice.freelancer?.gstin && <p className="text-xs text-text-muted mt-1">GSTIN: {invoice.freelancer.gstin}</p>}
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">To</p>
            <p className="font-semibold text-text-primary">{invoice.client?.name}</p>
            {invoice.client?.company && <p className="text-sm text-text-secondary">{invoice.client.company}</p>}
            {invoice.client?.email && <p className="text-sm text-text-muted">{invoice.client.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div><p className="text-xs text-text-muted uppercase tracking-wide">Invoice #</p><p className="font-mono font-semibold mt-1">{invoice.invoiceNumber}</p></div>
          <div><p className="text-xs text-text-muted uppercase tracking-wide">Issue Date</p><p className="mt-1">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-IN') : new Date(invoice.createdAt).toLocaleDateString('en-IN')}</p></div>
          <div><p className="text-xs text-text-muted uppercase tracking-wide">Due Date</p><p className="mt-1">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '—'}</p></div>
        </div>

        {/* Line Items */}
        <div className="rounded-lg border border-border overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-subtle">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-text-muted">Description</th>
                <th className="px-4 py-2 text-right text-xs text-text-muted">Qty</th>
                <th className="px-4 py-2 text-right text-xs text-text-muted">Unit Price</th>
                <th className="px-4 py-2 text-right text-xs text-text-muted">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(invoice.lineItems || invoice.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-text-primary">{item.description}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{formatINR(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-text-primary font-medium">{formatINR(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{formatINR(invoice.subtotal ?? invoice.subtotalAmount ?? subtotal)}</span></div>
            <div className="flex justify-between text-text-secondary"><span>Tax ({invoice.taxRate || 0}%)</span><span>{formatINR(invoice.taxAmount || 0)}</span></div>
            <div className="flex justify-between font-bold text-text-primary border-t border-border pt-2 mt-2 text-base"><span>Total</span><span>{formatINR(invoice.total ?? invoice.totalAmount ?? 0)}</span></div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-text-secondary">{invoice.notes}</p>
          </div>
        )}
      </Card>

      {/* Payment info if paid */}
      {invoice.status === 'paid' && invoice.paidAt && (
        <Card>
          <p className="text-sm font-semibold text-success mb-1">✓ Payment Received</p>
          <p className="text-sm text-text-secondary">Paid on {new Date(invoice.paidAt).toLocaleDateString('en-IN')}</p>
        </Card>
      )}

      {/* Payment Link Modal */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Payment Link Generated">
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Share this link with your client to collect payment:</p>
          <div className="flex gap-2">
            <input readOnly value={payLinkUrl || ''} className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-subtle font-mono" />
            <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(payLinkUrl); toast.success('Copied!'); }}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <a href={payLinkUrl} target="_blank" rel="noreferrer" className="block text-center text-sm text-accent hover:underline">Open payment page →</a>
          <Button variant="primary" className="w-full" onClick={() => setShowPayModal(false)}>Done</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={cancelTarget} onClose={() => setCancelTarget(false)} onConfirm={handleCancel} loading={cancelLoading} title="Cancel Invoice" message="Are you sure you want to cancel this invoice?" />
    </div>
  );
}
