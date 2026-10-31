import { TimeEntry } from '../models/TimeEntry.js';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { AppError } from '../middleware/errorHandler.js';

/** Parse YYYY-MM-DD as start/end of day in Asia/Kolkata (UTC+5:30 = 330 min offset) */
function istStartOfDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 330 * 60000);
}
function istEndOfDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - 330 * 60000);
}

// ── Timer operations ──────────────────────────────────────────────────────────

export async function startTimer(ownerId, taskId, { note, billable, project, projectId } = {}) {
  let projId = project || projectId;
  if (taskId) {
    const task = await Task.findById(taskId).populate('project');
    if (!task || task.owner.toString() !== ownerId.toString()) {
      throw new AppError('Task not found', 404, 'NOT_FOUND');
    }
    projId = task.project._id;
  }
  if (!projId) {
    throw new AppError('Project is required to start a timer', 400, 'BAD_REQUEST');
  }

  const existing = await TimeEntry.findOne({ owner: ownerId, endedAt: null });
  if (existing) throw new AppError('You already have an active timer. Stop it first.', 409, 'TIMER_ACTIVE');

  const entry = await TimeEntry.create({
    task: taskId || undefined,
    project: projId,
    owner: ownerId,
    startedAt: new Date(),
    endedAt: null,
    billable: billable !== undefined ? billable : true,
    note,
    source: 'timer',
  });
  return entry;
}

export async function stopTimer(ownerId, taskId) {
  const now = new Date();
  const query = { owner: ownerId, endedAt: null };
  if (taskId) query.task = taskId;
  const entry = await TimeEntry.findOne(query);
  if (!entry) throw new AppError('No active timer found', 404, 'NOT_FOUND');

  const durationMs = now - entry.startedAt;
  const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

  entry.endedAt = now;
  entry.durationMinutes = durationMinutes;
  await entry.save();
  return entry;
}

export async function getActiveTimer(ownerId) {
  const entry = await TimeEntry.findOne({ owner: ownerId, endedAt: null })
    .populate('task', 'title')
    .populate('project', 'title');
  return entry;
}

// ── Manual entry ──────────────────────────────────────────────────────────────

export async function createManualEntry(ownerId, data) {
  const { projectId, taskId, startedAt, endedAt, note, billable } = data;

  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');

  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const now = new Date();

  if (end <= start) throw new AppError('End time must be after start time', 400, 'INVALID_RANGE');
  if (end > now) throw new AppError('End time cannot be in the future', 400, 'INVALID_TIME');

  const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

  if (taskId) {
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');
  }

  return TimeEntry.create({
    task: taskId || null,
    project: projectId,
    owner: ownerId,
    startedAt: start,
    endedAt: end,
    durationMinutes,
    note,
    billable: billable !== undefined ? billable : true,
    source: 'manual',
  });
}

// ── List / CRUD ───────────────────────────────────────────────────────────────

export async function listTimeEntries(ownerId, { project, from, to, page = 1, limit = 50 } = {}) {
  const query = { owner: ownerId, endedAt: { $ne: null } };
  if (project) query.project = project;

  if (from || to) {
    query.startedAt = {};
    if (from) query.startedAt.$gte = istStartOfDay(from);
    if (to) query.startedAt.$lte = istEndOfDay(to);
  }

  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    TimeEntry.find(query)
      .populate('task', 'title')
      .populate('project', 'title')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TimeEntry.countDocuments(query),
  ]);

  return { entries, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function updateTimeEntry(ownerId, entryId, data) {
  const entry = await TimeEntry.findOne({ _id: entryId, owner: ownerId });
  if (!entry) throw new AppError('Time entry not found', 404, 'NOT_FOUND');
  if (entry.invoiced) throw new AppError('Cannot edit an invoiced time entry', 409, 'INVOICED');
  if (!entry.endedAt) throw new AppError('Cannot edit an active timer', 409, 'TIMER_ACTIVE');

  const updates = {};
  if (data.note !== undefined) updates.note = data.note;
  if (data.billable !== undefined) updates.billable = data.billable;
  if (data.startedAt || data.endedAt) {
    const start = data.startedAt ? new Date(data.startedAt) : entry.startedAt;
    const end = data.endedAt ? new Date(data.endedAt) : entry.endedAt;
    if (end <= start) throw new AppError('End time must be after start time', 400, 'INVALID_RANGE');
    if (end > new Date()) throw new AppError('End time cannot be in the future', 400, 'INVALID_TIME');
    updates.startedAt = start;
    updates.endedAt = end;
    updates.durationMinutes = Math.max(1, Math.round((end - start) / 60000));
  }

  Object.assign(entry, updates);
  await entry.save();
  return entry;
}

export async function deleteTimeEntry(ownerId, entryId) {
  const entry = await TimeEntry.findOne({ _id: entryId, owner: ownerId });
  if (!entry) throw new AppError('Time entry not found', 404, 'NOT_FOUND');
  if (entry.invoiced) throw new AppError('Cannot delete an invoiced time entry', 409, 'INVOICED');
  await TimeEntry.deleteOne({ _id: entryId });
  return { deleted: true };
}
