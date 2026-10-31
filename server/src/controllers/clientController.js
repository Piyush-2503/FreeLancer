import { z } from 'zod';
import { sendSuccess, sendError } from '../utils/response.js';
import * as clientService from '../services/clientService.js';

export const clientBodySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    company: z.string().max(100).optional(),
    address: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
  }),
});

export const clientQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform(v => (v ? Math.min(parseInt(v, 10), 100) : 20)),
    search: z.string().optional().default(''),
    includeArchived: z.string().optional().transform(v => v === 'true'),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const clientUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    company: z.string().max(100).optional(),
    address: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
  }),
});

export async function listClients(req, res, next) {
  try {
    const { page, limit, search, includeArchived } = req.validated.query;
    const result = await clientService.listClients(req.user._id, { page, limit, search, includeArchived });
    return sendSuccess(res, { clients: result.clients }, 200, { pagination: result.pagination });
  } catch (err) {
    next(err);
  }
}

export async function createClient(req, res, next) {
  try {
    const client = await clientService.createClient(req.user._id, req.validated.body);
    return sendSuccess(res, { client }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getClient(req, res, next) {
  try {
    const client = await clientService.getClient(req.user._id, req.params.id);
    return sendSuccess(res, { client });
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req, res, next) {
  try {
    const client = await clientService.updateClient(req.user._id, req.params.id, req.validated.body);
    return sendSuccess(res, { client });
  } catch (err) {
    next(err);
  }
}

export async function deleteClient(req, res, next) {
  try {
    const result = await clientService.deleteClient(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function archiveClient(req, res, next) {
  try {
    const client = await clientService.archiveClient(req.user._id, req.params.id);
    return sendSuccess(res, { client });
  } catch (err) {
    next(err);
  }
}

export async function unarchiveClient(req, res, next) {
  try {
    const client = await clientService.unarchiveClient(req.user._id, req.params.id);
    return sendSuccess(res, { client });
  } catch (err) {
    next(err);
  }
}
