import { z } from 'zod';
import { sendSuccess } from '../utils/response.js';
import * as portalService from '../services/portalService.js';
import { generateInvoicePDF } from '../utils/pdf.js';
import { User } from '../models/User.js';
import { Client } from '../models/Client.js';
import { env } from '../config/env.js';

export const messageBodySchema = z.object({
  body: z.object({ body: z.string().min(1).max(2000) }),
});

// ── Freelancer: generate portal link ─────────────────────────────────────────

export async function generatePortalLink(req, res, next) {
  try {
    const result = await portalService.generatePortalLink(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function revokePortalLink(req, res, next) {
  try {
    const client = await Client.findOne({ _id: req.params.id, owner: req.user._id });
    if (!client) return sendSuccess(res, null, 404);
    client.portalTokenHash = undefined;
    client.portalTokenExpiresAt = undefined;
    await client.save();
    return sendSuccess(res, { message: 'Portal access revoked' });
  } catch (err) { next(err); }
}

// ── Portal session ────────────────────────────────────────────────────────────

export async function createPortalSession(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return sendSuccess(res, null, 400);

    const { sessionToken, client } = await portalService.createPortalSession(token);
    res.cookie('portalToken', sessionToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return sendSuccess(res, { sessionToken, client: { id: client._id, name: client.name, email: client.email } });
  } catch (err) { next(err); }
}

export async function portalLogout(req, res, next) {
  res.clearCookie('portalToken', { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax' });
  return sendSuccess(res, { message: 'Logged out' });
}

export async function getPortalMe(req, res, next) {
  try {
    const me = await portalService.getPortalMe(req.portalClient);
    return sendSuccess(res, { client: me });
  } catch (err) { next(err); }
}

// ── Portal data ───────────────────────────────────────────────────────────────

export async function getPortalProjects(req, res, next) {
  try {
    const projects = await portalService.getPortalProjects(req.portalClient._id, req.portalOwnerId);
    return sendSuccess(res, { projects });
  } catch (err) { next(err); }
}

export async function getPortalProject(req, res, next) {
  try {
    const project = await portalService.getPortalProject(req.portalClient._id, req.portalOwnerId, req.params.id);
    return sendSuccess(res, { project });
  } catch (err) { next(err); }
}

export async function getPortalInvoices(req, res, next) {
  try {
    const invoices = await portalService.getPortalInvoices(req.portalClient._id, req.portalOwnerId);
    return sendSuccess(res, { invoices });
  } catch (err) { next(err); }
}

export async function getPortalInvoice(req, res, next) {
  try {
    const inv = await portalService.getPortalInvoice(req.portalClient._id, req.portalOwnerId, req.params.id);
    return sendSuccess(res, { invoice: inv });
  } catch (err) { next(err); }
}

export async function downloadPortalInvoicePDF(req, res, next) {
  try {
    const inv = await portalService.getPortalInvoice(req.portalClient._id, req.portalOwnerId, req.params.id);
    const freelancer = await User.findById(req.portalOwnerId);
    const client = await Client.findById(req.portalClient._id);
    generateInvoicePDF(inv, freelancer, client, res);
  } catch (err) { next(err); }
}

export async function getPortalMessages(req, res, next) {
  try {
    const result = await portalService.getPortalMessages(req.portalClient._id, req.portalOwnerId, req.params.id);
    return sendSuccess(res, { messages: result.messages }, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function postPortalMessage(req, res, next) {
  try {
    const msg = await portalService.postPortalMessage(req.portalClient._id, req.portalOwnerId, req.params.id, req.validated.body.body);
    return sendSuccess(res, { message: msg }, 201);
  } catch (err) { next(err); }
}
