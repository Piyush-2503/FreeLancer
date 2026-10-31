import { z } from 'zod';
import { sendSuccess } from '../utils/response.js';
import * as projectService from '../services/projectService.js';

// ── Validation schemas ────────────────────────────────────────────────────────

export const projectBodySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(5000).optional(),
    client: z.string().min(1, 'Client is required'),
    status: z.enum(['active', 'completed', 'archived']).optional(),
    billingType: z.enum(['hourly', 'fixed']).optional(),
    hourlyRate: z.number().min(0).optional(),
    fixedPrice: z.number().min(0).optional(),
    startDate: z.string().optional(),
    deadline: z.string().optional(),
  }),
});

export const projectUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    client: z.string().optional(),
    status: z.enum(['active', 'completed', 'archived']).optional(),
    billingType: z.enum(['hourly', 'fixed']).optional(),
    hourlyRate: z.number().min(0).optional(),
    fixedPrice: z.number().min(0).optional(),
    startDate: z.string().optional(),
    deadline: z.string().optional(),
  }),
});

export const projectQuerySchema = z.object({
  query: z.object({
    page: z.union([z.string(), z.number()]).optional().transform(v => v ? parseInt(String(v), 10) : 1),
    limit: z.union([z.string(), z.number()]).optional().transform(v => v ? Math.min(parseInt(String(v), 10), 100) : 20),
    status: z.string().optional(),
    client: z.string().optional(),
    clientId: z.string().optional(),
    search: z.string().optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const taskBodySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    estimateHours: z.number().min(0).optional(),
  }),
});

export const taskUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    estimateHours: z.number().min(0).optional(),
  }),
});

export const taskMoveSchema = z.object({
  body: z.object({
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    beforeId: z.string().optional(),
    afterId: z.string().optional(),
  }),
});

// ── Project Controllers ───────────────────────────────────────────────────────

export async function listProjects(req, res, next) {
  try {
    const { page, limit, status, client, clientId, search } = req.validated.query;
    const cleanStatus = status && status !== 'all' && status !== '' ? status : undefined;
    const result = await projectService.listProjects(req.user._id, {
      page,
      limit,
      status: cleanStatus,
      clientId: client || clientId,
      search,
    });
    return sendSuccess(res, { projects: result.projects }, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req.user._id, req.validated.body);
    return sendSuccess(res, { project }, 201);
  } catch (err) { next(err); }
}

export async function getProject(req, res, next) {
  try {
    const project = await projectService.getProject(req.user._id, req.params.id);
    return sendSuccess(res, { project });
  } catch (err) { next(err); }
}

export async function updateProject(req, res, next) {
  try {
    const project = await projectService.updateProject(req.user._id, req.params.id, req.validated.body);
    return sendSuccess(res, { project });
  } catch (err) { next(err); }
}

export async function deleteProject(req, res, next) {
  try {
    const result = await projectService.deleteProject(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

// ── Task Controllers ──────────────────────────────────────────────────────────

export async function listTasks(req, res, next) {
  try {
    const tasks = await projectService.listTasks(req.user._id, req.params.id);
    return sendSuccess(res, { tasks });
  } catch (err) { next(err); }
}

export async function createTask(req, res, next) {
  try {
    const task = await projectService.createTask(req.user._id, req.params.id, req.validated.body);
    return sendSuccess(res, { task }, 201);
  } catch (err) { next(err); }
}

export async function updateTask(req, res, next) {
  try {
    const task = await projectService.updateTask(req.user._id, req.params.id, req.validated.body);
    return sendSuccess(res, { task });
  } catch (err) { next(err); }
}

export async function moveTask(req, res, next) {
  try {
    const task = await projectService.moveTask(req.user._id, req.params.id, req.validated.body);
    return sendSuccess(res, { task });
  } catch (err) { next(err); }
}

export async function deleteTask(req, res, next) {
  try {
    const result = await projectService.deleteTask(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}
