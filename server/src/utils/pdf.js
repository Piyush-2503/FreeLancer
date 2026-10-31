import PDFDocument from 'pdfkit';
import { formatINR } from './money.js';

/**
 * Generate a professional invoice PDF using PDFKit.
 * Uses the sober palette: primary #1E293B, accent #2F5D8A, border #E2E8F0
 */
export function generateInvoicePDF(invoice, freelancer, client, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Pipe to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  const W = 595 - 100; // usable width
  const primaryColor = '#1E293B';
  const accentColor = '#2F5D8A';
  const mutedColor = '#64748B';
  const borderColor = '#E2E8F0';

  // ── Header ────────────────────────────────────────────────────────────────
  doc.rect(50, 30, W, 80).fill('#F8FAFC');
  doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold')
    .text(freelancer.businessName || freelancer.name, 60, 45);
  doc.fillColor(mutedColor).fontSize(9).font('Helvetica')
    .text(freelancer.address || '', 60, 72)
    .text(freelancer.email, 60, 84);
  if (freelancer.gstin) {
    doc.text(`GSTIN: ${freelancer.gstin}`, 60, 96);
  }

  // Invoice label
  doc.fillColor(accentColor).fontSize(28).font('Helvetica-Bold')
    .text('INVOICE', 400, 45, { align: 'right', width: 145 });
  doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
    .text(invoice.invoiceNumber, 400, 78, { align: 'right', width: 145 });

  // ── Bill To ───────────────────────────────────────────────────────────────
  let y = 135;
  doc.fillColor(mutedColor).fontSize(8).font('Helvetica-Bold')
    .text('BILL TO', 50, y);
  doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
    .text(client.name, 50, y + 14);
  if (client.company) doc.font('Helvetica').fontSize(9).text(client.company, 50, y + 27);
  if (client.email) doc.text(client.email, 50, y + 38);
  if (client.address) doc.text(client.address, 50, y + 49, { width: 200 });

  // Dates (right side)
  doc.fillColor(mutedColor).fontSize(8).font('Helvetica-Bold')
    .text('ISSUE DATE', 370, y);
  doc.fillColor(primaryColor).fontSize(9).font('Helvetica')
    .text(new Date(invoice.issueDate).toLocaleDateString('en-IN'), 370, y + 14);
  doc.fillColor(mutedColor).fontSize(8).font('Helvetica-Bold')
    .text('DUE DATE', 480, y);
  const dueDateColor = invoice.status === 'overdue' ? '#B4443C' : primaryColor;
  doc.fillColor(dueDateColor).fontSize(9).font('Helvetica')
    .text(new Date(invoice.dueDate).toLocaleDateString('en-IN'), 480, y + 14);

  // Status badge
  if (invoice.status === 'paid') {
    doc.rect(460, y + 28, 80, 20).fill('#E7F3EC');
    doc.fillColor('#2F7D5B').fontSize(9).font('Helvetica-Bold')
      .text('PAID', 460, y + 33, { width: 80, align: 'center' });
  } else if (invoice.status === 'overdue') {
    doc.rect(455, y + 28, 90, 20).fill('#F9E8E6');
    doc.fillColor('#B4443C').fontSize(9).font('Helvetica-Bold')
      .text('OVERDUE', 455, y + 33, { width: 90, align: 'center' });
  }

  // ── Line Items Table ──────────────────────────────────────────────────────
  y = 240;
  // Header row
  doc.rect(50, y, W, 22).fill('#F1F5F9');
  doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
    .text('DESCRIPTION', 58, y + 7)
    .text('QTY', 340, y + 7, { width: 50, align: 'right' })
    .text('RATE', 395, y + 7, { width: 70, align: 'right' })
    .text('AMOUNT', 470, y + 7, { width: 75, align: 'right' });

  y += 22;
  invoice.lineItems.forEach((item, i) => {
    if (i % 2 === 1) doc.rect(50, y, W, 20).fill('#FAFAFA');
    doc.fillColor(primaryColor).fontSize(9).font('Helvetica')
      .text(item.description, 58, y + 5, { width: 270 })
      .text(String(item.quantity), 340, y + 5, { width: 50, align: 'right' })
      .text(formatINR(item.unitPrice), 395, y + 5, { width: 70, align: 'right' })
      .text(formatINR(item.amount), 470, y + 5, { width: 75, align: 'right' });
    y += 22;
  });

  // Bottom border of table
  doc.moveTo(50, y).lineTo(50 + W, y).strokeColor(borderColor).lineWidth(1).stroke();

  // ── Totals ────────────────────────────────────────────────────────────────
  y += 12;
  const totalsX = 350;
  const totalsLabelW = 130;
  const totalsValW = 100;

  const addTotalRow = (label, value, bold = false, color = primaryColor) => {
    doc.fillColor(mutedColor).fontSize(9).font('Helvetica').text(label, totalsX, y, { width: totalsLabelW });
    doc.fillColor(color).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(formatINR(value), totalsX + totalsLabelW, y, { width: totalsValW, align: 'right' });
    y += 18;
  };

  addTotalRow('Subtotal', invoice.subtotal);
  addTotalRow(`Tax (${invoice.taxRate}%)`, invoice.taxAmount);
  doc.moveTo(totalsX, y).lineTo(50 + W, y).strokeColor(borderColor).stroke();
  y += 6;
  addTotalRow('TOTAL DUE', invoice.total, true, accentColor);

  // ── Payment Instructions ──────────────────────────────────────────────────
  if (invoice.paymentLinkUrl || freelancer.upiId) {
    y += 20;
    doc.rect(50, y, W, invoice.paymentLinkUrl && freelancer.upiId ? 70 : 50).fill('#E8EEF5');
    doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold').text('Payment Instructions', 60, y + 10);
    let payY = y + 24;
    if (invoice.paymentLinkUrl) {
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica')
        .text(`Pay online: ${invoice.paymentLinkUrl}`, 60, payY);
      payY += 14;
    }
    if (freelancer.upiId) {
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica')
        .text(`UPI ID: ${freelancer.upiId}`, 60, payY);
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.fillColor(mutedColor).fontSize(8).font('Helvetica')
    .text('Thank you for your business.', 50, 760, { align: 'center', width: W });

  doc.end();
}
