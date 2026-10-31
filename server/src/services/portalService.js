import jwt from 'jsonwebtoken';
import { Client } from '../models/Client.js';
import { Project } from '../models/Project.js';
import { Invoice } from '../models/Invoice.js';
import { Message } from '../models/Message.js';
import { Task } from '../models/Task.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateToken, hashToken } from '../utils/token.js';
import { generateInvoicePDF } from '../utils/pdf.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

// ── Portal link generation (called by freelancer) ─────────────────────────────

export async function generatePortalLink(ownerId, clientId) {
  const client = await Client.findOne({ _id: clientId, owner: ownerId });
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 86400000); // 7 days

  client.portalTokenHash = tokenHash;
  client.portalTokenExpiresAt = expiresAt;
  await client.save();

  const link = `${env.CLIENT_URL}/portal/login/${rawToken}`;
  return { link, expiresAt };
}

// ── Session creation (client exchanges token for session cookie) ───────────────

export async function createPortalSession(rawToken) {
  const tokenHash = hashToken(rawToken);
  const client = await Client.findOne({ portalTokenHash: tokenHash });
  if (!client) throw new AppError('Invalid or expired portal link', 401, 'INVALID_TOKEN');
  if (client.portalTokenExpiresAt < new Date()) throw new AppError('Portal link has expired', 410, 'EXPIRED');

  const sessionToken = jwt.sign(
    { sub: client._id.toString(), ownerId: client.owner.toString(), type: 'client' },
    env.PORTAL_JWT_SECRET,
    { expiresIn: '24h', audience: 'portal' }
  );

  client.lastPortalViewAt = new Date();
  await client.save();

  return { sessionToken, client };
}

// ── Portal auth middleware ─────────────────────────────────────────────────────

export async function authenticatePortal(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = req.cookies?.portalToken || bearerToken;
    if (!token) throw new AppError('Portal authentication required', 401, 'UNAUTHORIZED');

    const decoded = jwt.verify(token, env.PORTAL_JWT_SECRET, { audience: 'portal' });
    if (decoded.type !== 'client') throw new AppError('Invalid session type', 401, 'UNAUTHORIZED');

    const client = await Client.findOne({ _id: decoded.sub, owner: decoded.ownerId });
    if (!client) throw new AppError('Client not found', 401, 'UNAUTHORIZED');

    req.portalClient = client;
    req.portalOwnerId = decoded.ownerId;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Invalid or expired portal session', 401, 'UNAUTHORIZED'));
  }
}

// ── Portal data services ──────────────────────────────────────────────────────

export async function getPortalMe(client) {
  return { id: client._id, name: client.name, email: client.email, company: client.company };
}

export async function getPortalProjects(clientId, ownerId) {
  const projects = await Project.find({ client: clientId, owner: ownerId, status: { $ne: 'archived' } })
    .sort({ createdAt: -1 }).lean();

  const projectIds = projects.map(p => p._id);
  const taskCounts = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
  ]);
  const countMap = Object.fromEntries(taskCounts.map(t => [t._id.toString(), t]));

  return projects.map(p => ({
    ...p,
    progress: (() => {
      const c = countMap[p._id.toString()];
      if (!c || c.total === 0) return 0;
      return Math.round((c.done / c.total) * 100);
    })(),
  }));
}

export async function getPortalProject(clientId, ownerId, projectId) {
  const project = await Project.findOne({ _id: projectId, client: clientId, owner: ownerId });
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');

  const tasks = await Task.find({ project: projectId }).sort({ status: 1, order: 1 }).lean();
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;

  return { ...project.toObject(), tasks, progress: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export async function getPortalInvoices(clientId, ownerId) {
  // Exclude drafts from portal
  return Invoice.find({ client: clientId, owner: ownerId, status: { $ne: 'draft' } })
    .sort({ createdAt: -1 }).lean();
}

export async function getPortalInvoice(clientId, ownerId, invoiceId) {
  const inv = await Invoice.findOne({ _id: invoiceId, client: clientId, owner: ownerId, status: { $ne: 'draft' } });
  if (!inv) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
  return inv;
}

export async function getPortalMessages(clientId, ownerId, projectId, { page = 1, limit = 50 } = {}) {
  const project = await Project.findOne({ _id: projectId, client: clientId, owner: ownerId });
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    Message.find({ project: projectId }).sort({ sentAt: 1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments({ project: projectId }),
  ]);
  return { messages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function postPortalMessage(clientId, ownerId, projectId, body) {
  const project = await Project.findOne({ _id: projectId, client: clientId, owner: ownerId });
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
  const client = await Client.findById(clientId);
  const sanitized = body.replace(/[<>]/g, '').slice(0, 2000);
  return Message.create({
    project: projectId,
    owner: ownerId,
    senderType: 'client',
    senderId: clientId,
    senderName: client.name,
    body: sanitized,
    sentAt: new Date(),
  });
}
