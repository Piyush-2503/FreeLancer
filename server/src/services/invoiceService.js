import mongoose from 'mongoose';
import { Invoice, InvoiceCounter } from '../models/Invoice.js';
import { Client } from '../models/Client.js';
import { Project } from '../models/Project.js';
import { TimeEntry } from '../models/TimeEntry.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { calculateTax } from '../utils/money.js';

// ── Invoice number ────────────────────────────────────────────────────────────

async function nextInvoiceNumber(ownerId) {
  const year = new Date().getFullYear();
  const counter = await InvoiceCounter.findOneAndUpdate(
    { owner: ownerId },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return `INV-${year}-${String(counter.seq).padStart(4, '0')}`;
}

// ── Calculate totals (server-side only) ──────────────────────────────────────

function computeTotals(lineItems, taxRate) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = calculateTax(subtotal, taxRate);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

// ── Compute effective status (overdue detection on read) ──────────────────────

export function effectiveStatus(invoice) {
  if (['paid', 'cancelled'].includes(invoice.status)) return invoice.status;
  if (invoice.status !== 'draft' && invoice.dueDate < new Date()) return 'overdue';
  return invoice.status;
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function listInvoices(ownerId, { page = 1, limit = 20, status, clientId } = {}) {
  const query = { owner: ownerId };
  if (status) query.status = status;
  if (clientId) query.client = clientId;

  const skip = (page - 1) * limit;
  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate('client', 'name email')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(query),
  ]);

  return {
    invoices: invoices.map(inv => ({ ...inv, effectiveStatus: effectiveStatus(inv) })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function createInvoice(ownerId, data) {
  const { clientId, projectId, lineItems, taxRate, issueDate, dueDate, notes } = data;

  const [client, user] = await Promise.all([
    Client.findOne({ _id: clientId, owner: ownerId }),
    User.findById(ownerId),
  ]);
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');

  if (projectId) {
    const project = await Project.findOne({ _id: projectId, owner: ownerId });
    if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
  }

  const resolvedTaxRate = taxRate !== undefined ? taxRate : (user.defaultTaxRate || 18);
  const { subtotal, taxAmount, total } = computeTotals(lineItems, resolvedTaxRate);
  const invoiceNumber = await nextInvoiceNumber(ownerId);

  const invoice = await Invoice.create({
    owner: ownerId,
    client: clientId,
    project: projectId || null,
    invoiceNumber,
    lineItems,
    subtotal,
    taxRate: resolvedTaxRate,
    taxAmount,
    total,
    issueDate: new Date(issueDate),
    dueDate: new Date(dueDate),
    notes,
    status: 'draft',
  });

  return invoice.populate([
    { path: 'client', select: 'name email' },
    { path: 'project', select: 'title' },
  ]);
}

export async function createFromTimeEntries(ownerId, { projectId, timeEntryIds, taxRate, dueDate, notes }) {
  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
  if (project.billingType !== 'hourly') throw new AppError('Project must be hourly billing type', 400, 'BILLING_TYPE');

  const user = await User.findById(ownerId);
  const hourlyRate = project.hourlyRate || 0; // paise per hour

  // Atomically claim time entries
  const session = await mongoose.startSession();
  let invoice;
  try {
    await session.withTransaction(async () => {
      const claimResult = await TimeEntry.updateMany(
        { _id: { $in: timeEntryIds }, owner: ownerId, billable: true, invoiced: false },
        { $set: { invoiced: true } },
        { session }
      );

      if (claimResult.modifiedCount !== timeEntryIds.length) {
        throw new AppError('Some time entries are already invoiced or not found', 409, 'ALREADY_INVOICED');
      }

      const entries = await TimeEntry.find({ _id: { $in: timeEntryIds } }).session(session);
      const lineItems = entries.map(entry => {
        const hours = entry.durationMinutes / 60;
        const amount = Math.round(hours * hourlyRate);
        return {
          description: `${entry.note || 'Time entry'} (${(hours).toFixed(2)} hrs @ ₹${(hourlyRate / 100).toFixed(2)}/hr)`,
          quantity: parseFloat(hours.toFixed(2)),
          unitPrice: hourlyRate,
          amount,
        };
      });

      const resolvedTaxRate = taxRate !== undefined ? taxRate : (user.defaultTaxRate || 18);
      const { subtotal, taxAmount, total } = computeTotals(lineItems, resolvedTaxRate);
      const invoiceNumber = await nextInvoiceNumber(ownerId);

      const paymentTermsDays = user.defaultPaymentTermsDays || 30;
      const issueDateObj = new Date();
      const dueDateObj = dueDate ? new Date(dueDate) : new Date(Date.now() + paymentTermsDays * 86400000);

      const created = await Invoice.create([{
        owner: ownerId,
        client: project.client,
        project: projectId,
        invoiceNumber,
        lineItems,
        subtotal,
        taxRate: resolvedTaxRate,
        taxAmount,
        total,
        issueDate: issueDateObj,
        dueDate: dueDateObj,
        timeEntries: timeEntryIds,
        notes,
        status: 'draft',
      }], { session });

      // Link invoice ID back to entries
      await TimeEntry.updateMany(
        { _id: { $in: timeEntryIds } },
        { $set: { invoiceId: created[0]._id } },
        { session }
      );

      invoice = created[0];
    });
  } finally {
    await session.endSession();
  }

  return invoice;
}

export async function getInvoice(ownerId, id) {
  const invoice = await Invoice.findOne({ _id: id, owner: ownerId })
    .populate('client', 'name email phone address')
    .populate('project', 'title');
  if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');

  const inv = invoice.toObject();
  inv.effectiveStatus = effectiveStatus(inv);
  return inv;
}

export async function updateInvoice(ownerId, id, data) {
  const invoice = await Invoice.findOne({ _id: id, owner: ownerId });
  if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
  if (invoice.status !== 'draft') throw new AppError('Only draft invoices can be edited', 409, 'NOT_DRAFT');

  const updates = {};
  if (data.lineItems) {
    const user = await User.findById(ownerId);
    const taxRate = data.taxRate !== undefined ? data.taxRate : invoice.taxRate;
    const { subtotal, taxAmount, total } = computeTotals(data.lineItems, taxRate);
    updates.lineItems = data.lineItems;
    updates.subtotal = subtotal;
    updates.taxRate = taxRate;
    updates.taxAmount = taxAmount;
    updates.total = total;
  }
  if (data.taxRate !== undefined && !data.lineItems) {
    const { subtotal, taxAmount, total } = computeTotals(invoice.lineItems, data.taxRate);
    updates.taxRate = data.taxRate;
    updates.taxAmount = taxAmount;
    updates.total = total;
  }
  if (data.dueDate) updates.dueDate = new Date(data.dueDate);
  if (data.issueDate) updates.issueDate = new Date(data.issueDate);
  if (data.notes !== undefined) updates.notes = data.notes;

  return Invoice.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $set: updates },
    { returnDocument: 'after' }
  ).populate([{ path: 'client', select: 'name email' }, { path: 'project', select: 'title' }]);
}

export async function sendInvoice(ownerId, id) {
  const invoice = await Invoice.findOne({ _id: id, owner: ownerId });
  if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
  if (!['draft', 'overdue'].includes(invoice.status) && invoice.status !== 'sent') {
    throw new AppError('Invoice cannot be sent in its current status', 409, 'INVALID_STATUS');
  }

  invoice.status = 'sent';
  await invoice.save();
  return invoice;
}

export async function cancelInvoice(ownerId, id) {
  const invoice = await Invoice.findOne({ _id: id, owner: ownerId });
  if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
  if (invoice.status === 'paid') throw new AppError('Cannot cancel a paid invoice', 409, 'ALREADY_PAID');

  // Release time entries
  if (invoice.timeEntries?.length) {
    await TimeEntry.updateMany(
      { _id: { $in: invoice.timeEntries } },
      { $set: { invoiced: false, invoiceId: null } }
    );
  }

  invoice.status = 'cancelled';
  await invoice.save();
  return invoice;
}
