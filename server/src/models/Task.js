import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 2000 },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'done'],
    default: 'todo',
  },
  order: { type: Number, default: 0 },
  estimateHours: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

taskSchema.index({ project: 1, status: 1, order: 1 });
taskSchema.index({ owner: 1 });

export const Task = mongoose.model('Task', taskSchema);
