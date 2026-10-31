import { z } from 'zod';
import { sendSuccess } from '../utils/response.js';
import * as proposalService from '../services/proposalService.js';
import * as contractService from '../services/contractService.js';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// ── Proposal schemas ──────────────────────────────────────────────────────────

export const proposalBodySchema = z.object({
  body: z.object({
    clientId: z.string().min(1),
    projectId: z.string().optional(),
    title: z.string().min(1).max(200),
    scope: z.string().min(1).max(10000),
    deliverables: z.string().max(5000).optional(),
    price: z.number().min(0),
    validUntil: z.string().min(1),
  }),
});

export const proposalUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    scope: z.string().max(10000).optional(),
    deliverables: z.string().max(5000).optional(),
    price: z.number().min(0).optional(),
    validUntil: z.string().optional(),
  }),
});

// ── Contract schemas ──────────────────────────────────────────────────────────

export const contractBodySchema = z.object({
  body: z.object({
    clientId: z.string().min(1),
    projectId: z.string().optional(),
    proposalId: z.string().optional(),
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(50000),
  }),
});

export const contractUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    body: z.string().max(50000).optional(),
  }),
});

// ── Public rate limiter ───────────────────────────────────────────────────────

export const publicLimiter = env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

// ── Proposal Controllers ──────────────────────────────────────────────────────

export async function listProposals(req, res, next) {
  try {
    const result = await proposalService.listProposals(req.user._id);
    return sendSuccess(res, { proposals: result.proposals }, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function createProposal(req, res, next) {
  try {
    const p = await proposalService.createProposal(req.user._id, req.validated.body);
    return sendSuccess(res, { proposal: p }, 201);
  } catch (err) { next(err); }
}

export async function getProposal(req, res, next) {
  try {
    const p = await proposalService.getProposal(req.user._id, req.params.id);
    return sendSuccess(res, { proposal: p });
  } catch (err) { next(err); }
}

export async function updateProposal(req, res, next) {
  try {
    const p = await proposalService.updateProposal(req.user._id, req.params.id, req.validated.body);
    return sendSuccess(res, { proposal: p });
  } catch (err) { next(err); }
}

export async function sendProposal(req, res, next) {
  try {
    const result = await proposalService.sendProposal(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getPublicProposal(req, res, next) {
  try {
    const p = await proposalService.getPublicProposal(req.params.token);
    return sendSuccess(res, { proposal: p });
  } catch (err) { next(err); }
}

export async function respondToProposal(req, res, next) {
  try {
    const { decision } = req.body;
    if (!['accept', 'reject'].includes(decision)) return sendSuccess(res, null, 400);
    const p = await proposalService.respondToProposal(req.params.token, { decision });
    return sendSuccess(res, { proposal: p });
  } catch (err) { next(err); }
}

// ── Contract Controllers ──────────────────────────────────────────────────────

export async function listContracts(req, res, next) {
  try {
    const result = await contractService.listContracts(req.user._id);
    return sendSuccess(res, { contracts: result.contracts }, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function createContract(req, res, next) {
  try {
    const c = await contractService.createContract(req.user._id, req.validated.body);
    return sendSuccess(res, { contract: c }, 201);
  } catch (err) { next(err); }
}

export async function getContract(req, res, next) {
  try {
    const c = await contractService.getContract(req.user._id, req.params.id);
    return sendSuccess(res, { contract: c });
  } catch (err) { next(err); }
}

export async function updateContract(req, res, next) {
  try {
    const c = await contractService.updateContract(req.user._id, req.params.id, req.validated.body);
    return sendSuccess(res, { contract: c });
  } catch (err) { next(err); }
}

export async function sendContract(req, res, next) {
  try {
    const result = await contractService.sendContract(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getPublicContract(req, res, next) {
  try {
    const c = await contractService.getPublicContract(req.params.token);
    return sendSuccess(res, { contract: c });
  } catch (err) { next(err); }
}

export async function signContract(req, res, next) {
  try {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const { signerName, signatureImageData, signatureImage } = req.body;
    const c = await contractService.signContract(req.params.token, {
      signerName,
      signatureImageData: signatureImageData || signatureImage,
      ipAddress: ip,
    });
    return sendSuccess(res, { contract: c });
  } catch (err) { next(err); }
}
