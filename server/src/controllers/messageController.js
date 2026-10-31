import { z } from 'zod';
import { sendSuccess } from '../utils/response.js';
import { Message } from '../models/Message.js';
import { Project } from '../models/Project.js';
import { AppError } from '../middleware/errorHandler.js';

const messageSchema = z.object({
  body: z.object({ body: z.string().min(1).max(2000) }),
});

export async function listMessages(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');

    const page = parseInt(req.query.page || '1');
    const limit = Math.min(parseInt(req.query.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ project: req.params.id }).sort({ sentAt: 1 }).skip(skip).limit(limit).lean(),
      Message.countDocuments({ project: req.params.id }),
    ]);
    return sendSuccess(res, { messages }, 200, { pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
}

export async function postMessage(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');

    const body = String(req.body.body || '').replace(/[<>]/g, '').slice(0, 2000);
    if (!body.trim()) throw new AppError('Message body cannot be empty', 400, 'EMPTY_MESSAGE');

    const msg = await Message.create({
      project: req.params.id,
      owner: req.user._id,
      senderType: 'freelancer',
      senderId: req.user._id,
      senderName: req.user.name,
      body,
      sentAt: new Date(),
    });
    return sendSuccess(res, { message: msg }, 201);
  } catch (err) { next(err); }
}
