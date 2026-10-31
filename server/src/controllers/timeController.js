import { z } from 'zod';
import { sendSuccess } from '../utils/response.js';
import * as timeService from '../services/timeService.js';

export const manualEntrySchema = z.object({
  body: z.object({
    projectId: z.string().min(1, 'Project is required'),
    taskId: z.string().optional(),
    startedAt: z.string().min(1, 'Start time is required'),
    endedAt: z.string().min(1, 'End time is required'),
    note: z.string().max(500).optional(),
    billable: z.boolean().optional(),
  }),
});

export const updateEntrySchema = z.object({
  body: z.object({
    startedAt: z.string().optional(),
    endedAt: z.string().optional(),
    note: z.string().max(500).optional(),
    billable: z.boolean().optional(),
  }),
});

export const listEntriesSchema = z.object({
  query: z.object({
    project: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
    limit: z.string().optional().transform(v => v ? Math.min(parseInt(v, 10), 100) : 50),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export async function startTimer(req, res, next) {
  try {
    const entry = await timeService.startTimer(req.user._id, req.params.taskId, req.body);
    return sendSuccess(res, { entry }, 201);
  } catch (err) { next(err); }
}

export async function stopTimer(req, res, next) {
  try {
    const entry = await timeService.stopTimer(req.user._id, req.params.taskId);
    return sendSuccess(res, { entry });
  } catch (err) { next(err); }
}

export async function getActiveTimer(req, res, next) {
  try {
    const entry = await timeService.getActiveTimer(req.user._id);
    return sendSuccess(res, { entry });
  } catch (err) { next(err); }
}

export async function createManualEntry(req, res, next) {
  try {
    const entry = await timeService.createManualEntry(req.user._id, req.validated.body);
    return sendSuccess(res, { entry }, 201);
  } catch (err) { next(err); }
}

export async function listTimeEntries(req, res, next) {
  try {
    const { project, from, to, page, limit } = req.validated.query;
    const result = await timeService.listTimeEntries(req.user._id, { project, from, to, page, limit });
    return sendSuccess(res, { entries: result.entries }, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function updateTimeEntry(req, res, next) {
  try {
    const entry = await timeService.updateTimeEntry(req.user._id, req.params.id, req.validated.body);
    return sendSuccess(res, { entry });
  } catch (err) { next(err); }
}

export async function deleteTimeEntry(req, res, next) {
  try {
    const result = await timeService.deleteTimeEntry(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}
