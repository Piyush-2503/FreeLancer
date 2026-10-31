import { z } from 'zod';
import { sendSuccess } from '../utils/response.js';
import * as invoiceService from '../services/invoiceService.js';
import { generateInvoicePDF } from '../utils/pdf.js';
import { User } from '../models/User.js';
import { Client } from '../models/Client.js';

const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0), // paise
  amount: z.number().min(0),   // paise (client can send; server recalculates)
});

export const invoiceBodySchema = z.object({
  body: z.object({
    clientId: z.string().min(1),
    projectId: z.string().optional(),
    lineItems: z.array(lineItemSchema).min(1),
    taxRate: z.number().min(0).max(100).optional(),
    issueDate: z.string().min(1),
    dueDate: z.string().min(1),
    notes: z.string().max(2000).optional(),
  }),
});

export const invoiceFromTimeSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    timeEntryIds: z.array(z.string()).min(1),
    taxRate: z.number().min(0).max(100).optional(),
    dueDate: z.string().optional(),
    notes: z.string().max(2000).optional(),
  }),
});

export const invoiceQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
    limit: z.string().optional().transform(v => v ? Math.min(parseInt(v, 10), 100) : 20),
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
    client: z.string().optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const invoiceUpdateSchema = z.object({
  body: z.object({
    lineItems: z.array(lineItemSchema).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    dueDate: z.string().optional(),
    issueDate: z.string().optional(),
    notes: z.string().max(2000).optional(),
  }),
});

export async function listInvoices(req, res, next) {
  try {
    const { page, limit, status, client } = req.validated.query;
    const result = await invoiceService.listInvoices(req.user._id, { page, limit, status, clientId: client });
    return sendSuccess(res, { invoices: result.invoices }, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function createInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.createInvoice(req.user._id, req.validated.body);
    return sendSuccess(res, { invoice }, 201);
  } catch (err) { next(err); }
}

export async function createFromTime(req, res, next) {
  try {
    const invoice = await invoiceService.createFromTimeEntries(req.user._id, req.validated.body);
    return sendSuccess(res, { invoice }, 201);
  } catch (err) { next(err); }
}

export async function getInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.getInvoice(req.user._id, req.params.id);
    return sendSuccess(res, { invoice });
  } catch (err) { next(err); }
}

export async function updateInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.updateInvoice(req.user._id, req.params.id, req.validated.body);
    return sendSuccess(res, { invoice });
  } catch (err) { next(err); }
}

export async function sendInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.sendInvoice(req.user._id, req.params.id);
    return sendSuccess(res, { invoice });
  } catch (err) { next(err); }
}

export async function cancelInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.cancelInvoice(req.user._id, req.params.id);
    return sendSuccess(res, { invoice });
  } catch (err) { next(err); }
}

export async function downloadPDF(req, res, next) {
  try {
    const invoice = await invoiceService.getInvoice(req.user._id, req.params.id);
    const freelancer = await User.findById(req.user._id);
    const client = await Client.findById(invoice.client._id || invoice.client);
    generateInvoicePDF(invoice, freelancer, client, res);
  } catch (err) { next(err); }
}
