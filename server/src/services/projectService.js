import { Client } from '../models/Client.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { TimeEntry } from '../models/TimeEntry.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listProjects(ownerId, { page = 1, limit = 20, status, clientId, search } = {}) {
  const query = { owner: ownerId };
  if (status && status !== 'all') query.status = status;
  if (clientId) query.client = clientId;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('client', 'name email company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(query),
  ]);

  // Attach task progress & tracked time to each project
  const projectIds = projects.map(p => p._id);
  const [taskCounts, timeCounts] = await Promise.all([
    Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
    ]),
    TimeEntry.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', totalMinutes: { $sum: '$durationMinutes' } } },
    ]),
  ]);
  const countMap = Object.fromEntries(taskCounts.map(t => [t._id.toString(), t]));
  const timeMap = Object.fromEntries(timeCounts.map(t => [t._id.toString(), t.totalMinutes]));

  return {
    projects: projects.map(p => ({
      ...p,
      taskProgress: countMap[p._id.toString()] || { total: 0, done: 0 },
      trackedMinutes: timeMap[p._id.toString()] || 0,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function createProject(ownerId, data) {
  // Verify client belongs to owner
  const client = await Client.findOne({ _id: data.client, owner: ownerId });
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');

  const project = await Project.create({ owner: ownerId, ...data });
  return project.populate('client', 'name email company');
}

export async function getProject(ownerId, id) {
  const project = await Project.findOne({ _id: id, owner: ownerId })
    .populate('client', 'name email company');
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');

  const [taskStats, timeStats] = await Promise.all([
    Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    TimeEntry.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' }, billableMinutes: { $sum: { $cond: ['$billable', '$durationMinutes', 0] } } } },
    ]),
  ]);
  const statsByStatus = Object.fromEntries(taskStats.map(s => [s._id, s.count]));
  const totalTasks = Object.values(statsByStatus).reduce((a, b) => a + b, 0);
  const doneTasks = statsByStatus.done || 0;
  const trackedMinutes = timeStats[0]?.totalMinutes || 0;
  const billableMinutes = timeStats[0]?.billableMinutes || 0;

  return {
    ...project.toObject(),
    taskProgress: { total: totalTasks, done: doneTasks },
    tasksByStatus: statsByStatus,
    trackedMinutes,
    billableMinutes,
  };
}

export async function updateProject(ownerId, id, data) {
  // If client is being changed, verify the new client belongs to owner
  if (data.client) {
    const client = await Client.findOne({ _id: data.client, owner: ownerId });
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $set: data },
    { returnDocument: 'after', runValidators: true }
  ).populate('client', 'name email company');
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
  return project;
}

export async function deleteProject(ownerId, id) {
  const project = await Project.findOne({ _id: id, owner: ownerId });
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');

  // Check for invoices and time entries
  let hasInvoices = false, hasTimeEntries = false;
  try {
    const { Invoice } = await import('../models/Invoice.js').catch(() => ({ Invoice: null }));
    if (Invoice) hasInvoices = await Invoice.exists({ project: id, owner: ownerId });
  } catch { /* not available yet */ }

  try {
    const { TimeEntry } = await import('../models/TimeEntry.js').catch(() => ({ TimeEntry: null }));
    if (TimeEntry) hasTimeEntries = await TimeEntry.exists({ project: id, owner: ownerId });
  } catch { /* not available yet */ }

  if (hasInvoices || hasTimeEntries) {
    throw new AppError(
      'Cannot delete project with invoices or time entries. Archive the project instead.',
      409, 'HAS_ASSOCIATIONS'
    );
  }

  // Cascade delete tasks and messages
  await Task.deleteMany({ project: id });
  try {
    const { Message } = await import('../models/Message.js').catch(() => ({ Message: null }));
    if (Message) await Message.deleteMany({ project: id });
  } catch { /* not available yet */ }

  await Project.deleteOne({ _id: id, owner: ownerId });
  return { deleted: true };
}

// ── Task service ──────────────────────────────────────────────────────────────

export async function listTasks(ownerId, projectId) {
  // Verify project belongs to owner
  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');

  const tasks = await Task.find({ project: projectId })
    .sort({ status: 1, order: 1 })
    .lean();
  return tasks;
}

export async function createTask(ownerId, projectId, data) {
  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');

  // Assign next order in the column
  const maxOrderDoc = await Task.findOne({ project: projectId, status: data.status || 'todo' })
    .sort({ order: -1 }).lean();
  const order = maxOrderDoc ? maxOrderDoc.order + 1000 : 1000;

  const task = await Task.create({ project: projectId, owner: ownerId, order, ...data });
  return task;
}

export async function updateTask(ownerId, taskId, data) {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, owner: ownerId },
    { $set: data },
    { returnDocument: 'after', runValidators: true }
  );
  if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');
  return task;
}

export async function moveTask(ownerId, taskId, { status, beforeId, afterId }) {
  const task = await Task.findOne({ _id: taskId, owner: ownerId });
  if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');

  const updates = {};
  if (status && status !== task.status) updates.status = status;

  // Fractional ordering: place between beforeId and afterId
  if (beforeId || afterId) {
    const [before, after] = await Promise.all([
      beforeId ? Task.findById(beforeId).lean() : Promise.resolve(null),
      afterId ? Task.findById(afterId).lean() : Promise.resolve(null),
    ]);

    const targetStatus = status || task.status;
    let newOrder;

    if (!before && after) {
      // Place at top
      newOrder = after.order - 500;
    } else if (before && !after) {
      // Place at bottom
      newOrder = before.order + 1000;
    } else if (before && after) {
      // Place between
      newOrder = (before.order + after.order) / 2;
    } else {
      // No neighbors — place at end of column
      const maxDoc = await Task.findOne({ project: task.project, status: targetStatus, _id: { $ne: taskId } })
        .sort({ order: -1 }).lean();
      newOrder = maxDoc ? maxDoc.order + 1000 : 1000;
    }

    // If order precision gets too small, re-index the column
    if (Math.abs(newOrder - Math.round(newOrder)) > 0 && Math.abs(newOrder - Math.round(newOrder)) < 0.01) {
      await reindexColumn(task.project, updates.status || task.status);
      const reindexed = await Task.findById(taskId).lean();
      newOrder = reindexed.order; // Will be set by reindex
    }

    updates.order = newOrder;
  }

  const updated = await Task.findOneAndUpdate(
    { _id: taskId, owner: ownerId },
    { $set: updates },
    { returnDocument: 'after' }
  );
  return updated;
}

async function reindexColumn(projectId, status) {
  const tasks = await Task.find({ project: projectId, status }).sort({ order: 1 }).lean();
  const bulkOps = tasks.map((t, i) => ({
    updateOne: {
      filter: { _id: t._id },
      update: { $set: { order: (i + 1) * 1000 } },
    },
  }));
  if (bulkOps.length) await Task.bulkWrite(bulkOps);
}

export async function deleteTask(ownerId, taskId) {
  const task = await Task.findOneAndDelete({ _id: taskId, owner: ownerId });
  if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');
  return { deleted: true };
}
