import mongoose from 'mongoose';
import { Client } from '../models/Client.js';

/**
 * Run real aggregation queries to produce dashboard summary.
 * Models not yet created (Project, Invoice, TimeEntry) return zeros gracefully.
 */
export async function getDashboardSummary(ownerId) {
  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

  // Total active clients
  const totalClients = await Client.countDocuments({ owner: ownerObjectId, archivedAt: null });

  // Try aggregations on models that may not exist yet
  let activeProjects = 0;
  let completedProjects = 0;
  let outstandingAmount = 0;
  let overdueCount = 0;
  let paidThisMonth = 0;
  let hoursThisWeek = 0;

  try {
    const { Project } = await import('../models/Project.js').catch(() => ({ Project: null }));
    if (Project) {
      const [activeResult, completedResult] = await Promise.all([
        Project.countDocuments({ owner: ownerObjectId, status: 'active' }),
        Project.countDocuments({ owner: ownerObjectId, status: 'completed' }),
      ]);
      activeProjects = activeResult;
      completedProjects = completedResult;
    }
  } catch { /* model not ready */ }

  try {
    const { Invoice } = await import('../models/Invoice.js').catch(() => ({ Invoice: null }));
    if (Invoice) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const [outstandingResult, overdueResult, paidResult] = await Promise.all([
        // Total outstanding (sent + overdue)
        Invoice.aggregate([
          { $match: { owner: ownerObjectId, status: { $in: ['sent', 'overdue'] } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        // Overdue count
        Invoice.countDocuments({ owner: ownerObjectId, status: 'overdue' }),
        // Paid this month
        Invoice.aggregate([
          {
            $match: {
              owner: ownerObjectId,
              status: 'paid',
              paidAt: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);

      outstandingAmount = outstandingResult[0]?.total ?? 0;
      overdueCount = overdueResult;
      paidThisMonth = paidResult[0]?.total ?? 0;
    }
  } catch { /* model not ready */ }

  try {
    const { TimeEntry } = await import('../models/TimeEntry.js').catch(() => ({ TimeEntry: null }));
    if (TimeEntry) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const hoursResult = await TimeEntry.aggregate([
        { $match: { owner: ownerObjectId, createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
      ]);
      hoursThisWeek = (hoursResult[0]?.totalMinutes ?? 0) / 60;
    }
  } catch { /* model not ready */ }

  return {
    totalClients,
    activeProjects,
    completedProjects,
    outstandingAmount,
    overdueCount,
    paidThisMonth,
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
  };
}
