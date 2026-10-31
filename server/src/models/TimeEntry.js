import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, default: null },        // null = timer currently running
  durationMinutes: { type: Number, default: 0 }, // always set by server on stop
  note: { type: String, trim: true, maxlength: 500 },
  billable: { type: Boolean, default: true },
  invoiced: { type: Boolean, default: false },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
  source: { type: String, enum: ['timer', 'manual'], default: 'timer' },
}, { timestamps: true });

// Partial unique index: only one active timer per owner (endedAt is null)
timeEntrySchema.index(
  { owner: 1 },
  { unique: true, partialFilterExpression: { endedAt: null }, name: 'one_active_timer_per_owner' }
);

timeEntrySchema.index({ owner: 1, project: 1 });
timeEntrySchema.index({ owner: 1, invoiced: 1 });
timeEntrySchema.index({ owner: 1, createdAt: -1 });

export const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);
