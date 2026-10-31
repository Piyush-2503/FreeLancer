import { Proposal } from '../models/Proposal.js';
import { Client } from '../models/Client.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateToken, hashToken } from '../utils/token.js';
import { sendMail } from '../config/mailer.js';
import { formatINR } from '../utils/money.js';
import { env } from '../config/env.js';

export async function listProposals(ownerId, { page = 1, limit = 20, status } = {}) {
  const query = { owner: ownerId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const [proposals, total] = await Promise.all([
    Proposal.find(query).populate('client', 'name email').populate('project', 'title')
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Proposal.countDocuments(query),
  ]);
  return { proposals, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function createProposal(ownerId, data) {
  const client = await Client.findOne({ _id: data.clientId, owner: ownerId });
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
  return Proposal.create({ owner: ownerId, client: data.clientId, ...data });
}

export async function getProposal(ownerId, id) {
  const p = await Proposal.findOne({ _id: id, owner: ownerId })
    .populate('client', 'name email').populate('project', 'title');
  if (!p) throw new AppError('Proposal not found', 404, 'NOT_FOUND');
  return p;
}

export async function updateProposal(ownerId, id, data) {
  const p = await Proposal.findOne({ _id: id, owner: ownerId });
  if (!p) throw new AppError('Proposal not found', 404, 'NOT_FOUND');
  if (p.status !== 'draft') throw new AppError('Only draft proposals can be edited', 409, 'NOT_DRAFT');
  return Proposal.findOneAndUpdate({ _id: id, owner: ownerId }, { $set: data }, { returnDocument: 'after' });
}

export async function sendProposal(ownerId, id) {
  const p = await Proposal.findOne({ _id: id, owner: ownerId }).populate('client', 'name email');
  if (!p) throw new AppError('Proposal not found', 404, 'NOT_FOUND');
  if (!['draft', 'sent'].includes(p.status)) throw new AppError('Cannot send in current status', 409, 'INVALID_STATUS');
  if (!p.client?.email) throw new AppError('Client has no email address', 400, 'NO_CLIENT_EMAIL');

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(p.validUntil || Date.now() + 30 * 86400000);

  p.accessTokenHash = tokenHash;
  p.accessTokenExpiresAt = expiresAt;
  p.status = 'sent';
  await p.save();

  const link = `${env.CLIENT_URL}/proposals/${rawToken}`;
  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
      <h1 style="color: #1E293B; font-size: 20px;">Proposal: ${p.title}</h1>
      <p style="color: #475569;">Dear ${p.client.name},</p>
      <p style="color: #0F172A;">Please review and respond to the proposal at the link below.</p>
      <p style="color: #0F172A;"><strong>Total: ${formatINR(p.price)}</strong></p>
      <p style="color: #0F172A;">Valid until: ${new Date(p.validUntil).toLocaleDateString('en-IN')}</p>
      <a href="${link}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#2F5D8A;color:#fff;text-decoration:none;border-radius:8px;">View Proposal</a>
    </div>`;

  const result = await sendMail({ to: p.client.email, subject: `Proposal: ${p.title}`, html, text: `View proposal: ${link}` });
  if (result.previewUrl) console.log('Proposal email preview:', result.previewUrl);

  return { proposal: p, link, publicToken: rawToken };
}

// ── Public endpoints ──────────────────────────────────────────────────────────

export async function getPublicProposal(rawToken) {
  const tokenHash = hashToken(rawToken);
  const p = await Proposal.findOne({ accessTokenHash: tokenHash })
    .populate('client', 'name').populate('project', 'title').populate('owner', 'name businessName');
  if (!p) throw new AppError('Proposal not found', 404, 'NOT_FOUND');

  // Lazy expire
  if (p.accessTokenExpiresAt < new Date() && p.status === 'sent') {
    p.status = 'expired';
    await p.save();
  }
  if (p.status === 'expired') throw new AppError('This proposal has expired', 410, 'EXPIRED');

  return p;
}

export async function respondToProposal(rawToken, { decision }) {
  const tokenHash = hashToken(rawToken);
  const p = await Proposal.findOne({ accessTokenHash: tokenHash });
  if (!p) throw new AppError('Proposal not found', 404, 'NOT_FOUND');
  if (p.status !== 'sent') throw new AppError('Proposal cannot be responded to in its current state', 409, 'INVALID_STATUS');
  if (p.accessTokenExpiresAt < new Date()) throw new AppError('Proposal has expired', 410, 'EXPIRED');

  p.status = decision === 'accept' ? 'accepted' : 'rejected';
  p.respondedAt = new Date();
  await p.save();
  return p;
}
