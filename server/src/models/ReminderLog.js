import mongoose from 'mongoose';

const reminderLogSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  type: {
    type: String,
    enum: ['3_days_before', 'due_today', '3_days_overdue', '7_days_overdue', '14_days_overdue'],
    required: true,
  },
  sentAt: { type: Date },
  status: { type: String, enum: ['sent', 'failed'], required: true },
  error: { type: String },
  previewUrl: { type: String },
}, { timestamps: true });

// Prevent duplicate sends per invoice per type
reminderLogSchema.index(
  { invoice: 1, type: 1 },
  { unique: true, partialFilterExpression: { status: 'sent' } }
);

export const ReminderLog = mongoose.model('ReminderLog', reminderLogSchema);
