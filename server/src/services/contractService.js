import crypto from 'crypto';
import { Contract } from '../models/Contract.js';
import { Client } from '../models/Client.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateToken, hashToken } from '../utils/token.js';
import { sendMail } from '../config/mailer.js';
import { env } from '../config/env.js';

export async function listContracts(ownerId, { page = 1, limit = 20, status } = {}) {
  const query = { owner: ownerId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const [contracts, total] = await Promise.all([
    Contract.find(query).populate('client', 'name email').populate('project', 'title')
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Contract.countDocuments(query),
  ]);
  return { contracts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function createContract(ownerId, data) {
  const client = await Client.findOne({ _id: data.clientId, owner: ownerId });
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
  return Contract.create({ owner: ownerId, client: data.clientId, ...data });
}

export async function getContract(ownerId, id) {
  const c = await Contract.findOne({ _id: id, owner: ownerId })
    .populate('client', 'name email').populate('project', 'title');
  if (!c) throw new AppError('Contract not found', 404, 'NOT_FOUND');
  return c;
}

export async function updateContract(ownerId, id, data) {
  const c = await Contract.findOne({ _id: id, owner: ownerId });
  if (!c) throw new AppError('Contract not found', 404, 'NOT_FOUND');
  if (c.status !== 'draft') throw new AppError('Only draft contracts can be edited', 409, 'NOT_DRAFT');
  return Contract.findOneAndUpdate({ _id: id, owner: ownerId }, { $set: data }, { returnDocument: 'after' });
}

export async function sendContract(ownerId, id) {
  const c = await Contract.findOne({ _id: id, owner: ownerId }).populate('client', 'name email');
  if (!c) throw new AppError('Contract not found', 404, 'NOT_FOUND');
  if (!['draft', 'sent'].includes(c.status)) throw new AppError('Cannot send in current status', 409, 'INVALID_STATUS');
  if (!c.client?.email) throw new AppError('Client has no email address', 400, 'NO_CLIENT_EMAIL');

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  c.accessTokenHash = tokenHash;
  c.accessTokenExpiresAt = new Date(Date.now() + 30 * 86400000);
  c.status = 'sent';
  await c.save();

  const link = `${env.CLIENT_URL}/contracts/${rawToken}`;
  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
      <h1 style="color: #1E293B; font-size: 20px;">Contract for Signature: ${c.title}</h1>
      <p style="color: #475569;">Dear ${c.client.name},</p>
      <p style="color: #0F172A;">Please review and sign the contract at the link below.</p>
      <a href="${link}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#2F5D8A;color:#fff;text-decoration:none;border-radius:8px;">Review & Sign Contract</a>
      <p style="margin-top:20px;color:#64748B;font-size:12px;">⚠️ This is a demonstration electronic signature, not a legally certified digital signature.</p>
    </div>`;

  const result = await sendMail({ to: c.client.email, subject: `Contract for Signature: ${c.title}`, html, text: `Sign contract: ${link}` });
  if (result.previewUrl) console.log('Contract email preview:', result.previewUrl);
  return { contract: c, link, publicToken: rawToken };
}

// ── Public endpoints ──────────────────────────────────────────────────────────

export async function getPublicContract(rawToken) {
  const tokenHash = hashToken(rawToken);
  const c = await Contract.findOne({ accessTokenHash: tokenHash })
    .populate('client', 'name').populate('owner', 'name businessName');
  if (!c) throw new AppError('Contract not found', 404, 'NOT_FOUND');
  if (c.accessTokenExpiresAt < new Date()) throw new AppError('Contract link has expired', 410, 'EXPIRED');
  if (c.status === 'signed') return c;
  if (c.status !== 'sent') throw new AppError('Contract is not available for signing', 409, 'INVALID_STATUS');
  return c;
}

export async function signContract(rawToken, { signerName, signatureImageData, ipAddress }) {
  const tokenHash = hashToken(rawToken);
  const c = await Contract.findOne({ accessTokenHash: tokenHash });
  if (!c) throw new AppError('Contract not found', 404, 'NOT_FOUND');
  if (c.status === 'signed') throw new AppError('Contract has already been signed', 409, 'ALREADY_SIGNED');
  if (c.status !== 'sent') throw new AppError('Contract is not available for signing', 409, 'INVALID_STATUS');
  if (c.accessTokenExpiresAt < new Date()) throw new AppError('Contract link has expired', 410, 'EXPIRED');

  // Validate signature data
  if (!signatureImageData?.startsWith('data:image/png;base64,')) {
    throw new AppError('Invalid signature image format', 400, 'INVALID_SIGNATURE');
  }
  const base64Data = signatureImageData.replace('data:image/png;base64,', '');
  const sizeBytes = Buffer.byteLength(base64Data, 'base64');
  if (sizeBytes > 500 * 1024) throw new AppError('Signature image too large (max 500KB)', 400, 'SIGNATURE_TOO_LARGE');

  const bodyHash = crypto.createHash('sha256').update(c.body).digest('hex');

  c.status = 'signed';
  c.lockedAt = new Date();
  c.bodyHash = bodyHash;
  c.signature = {
    imageData: signatureImageData,
    signerName,
    signedAt: new Date(),
    ipAddress,
  };
  await c.save();
  return c;
}
