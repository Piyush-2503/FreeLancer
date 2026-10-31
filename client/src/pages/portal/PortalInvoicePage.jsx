import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { portalApi } from '../../api/portal.js';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';

const STATUS_BADGE = { draft: 'default', sent: 'info', paid: 'success', overdue: 'danger', cancelled: 'default' };

function formatINR(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100);
}

export default function PortalInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    portalApi.getInvoice(id)
      .then(res => setInvoice(res.data?.data?.invoice || res.data?.invoice || res.data?.data || res.data))
      .catch(() => navigate('/portal'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      const res = await portalApi.invoicePdf(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    finally { setPdfLoading(false); }
  }

  if (loading) return <div className="min-h-screen bg-page p-8"><SkeletonCard /></div>;
  if (!invoice) return null;

  const canPay = (invoice.status === 'sent' || invoice.status === 'overdue') && invoice.paymentLinkUrl;

  return (
    <div className="min-h-screen bg-page">
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to="/portal" className="p-1.5 rounded-lg text-text-muted hover:bg-subtle"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-text-primary">Client Portal</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary font-mono">{invoice.invoiceNumber}</h1>
              <Badge variant={STATUS_BADGE[invoice.status] || 'default'}>{invoice.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" loading={pdfLoading} onClick={handleDownloadPdf}>
              <Download className="w-3.5 h-3.5 mr-1.5" />PDF
            </Button>
            {canPay && (
              <a href={invoice.paymentLinkUrl} target="_blank" rel="noreferrer">
                <Button variant="primary" size="sm">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Pay Now
                </Button>
              </a>
            )}
          </div>
        </div>

        {(invoice.status === 'sent' || invoice.status === 'overdue') && !invoice.paymentLinkUrl && (
          <div className="p-3 bg-subtle border border-border rounded-lg text-sm text-text-secondary">
            Payment link not yet generated. Contact your freelancer to request a payment link.
          </div>
        )}

        <Card>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">From</p>
              <p className="font-semibold text-text-primary">{invoice.freelancer?.businessName || invoice.freelancer?.name}</p>
              {invoice.freelancer?.address && <p className="text-sm text-text-secondary">{invoice.freelancer.address}</p>}
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">To</p>
              <p className="font-semibold text-text-primary">{invoice.client?.name}</p>
              {invoice.client?.company && <p className="text-sm text-text-secondary">{invoice.client.company}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div><p className="text-xs text-text-muted uppercase tracking-wide">Invoice #</p><p className="font-mono font-semibold mt-1">{invoice.invoiceNumber}</p></div>
            <div><p className="text-xs text-text-muted uppercase tracking-wide">Issue Date</p><p className="mt-1">{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</p></div>
            <div><p className="text-xs text-text-muted uppercase tracking-wide">Due Date</p><p className={`mt-1 ${invoice.status === 'overdue' ? 'text-danger font-medium' : ''}`}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '—'}</p></div>
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
                    <td className="px-4 py-3 text-right font-medium">{formatINR(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-52 space-y-1 text-sm">
              <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{formatINR(invoice.subtotal ?? invoice.subtotalAmount ?? 0)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>Tax ({invoice.taxRate || 0}%)</span><span>{formatINR(invoice.taxAmount ?? 0)}</span></div>
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

        {invoice.status === 'paid' && (
          <div className="p-4 bg-success-soft border border-success/20 rounded-xl text-center">
            <p className="font-semibold text-success">✓ Payment Received</p>
            {invoice.paidAt && <p className="text-sm text-text-secondary mt-1">Paid on {new Date(invoice.paidAt).toLocaleDateString('en-IN')}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
