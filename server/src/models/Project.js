import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 5000 },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
    index: true,
  },
  billingType: { type: String, enum: ['hourly', 'fixed'], default: 'fixed' },
  hourlyRate: { type: Number, min: 0, default: 0 },  // stored in paise
  fixedPrice: { type: Number, min: 0, default: 0 },  // stored in paise
  startDate: { type: Date },
  deadline: { type: Date },
}, { timestamps: true });

projectSchema.index({ owner: 1, client: 1 });
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ owner: 1, createdAt: -1 });

export const Project = mongoose.model('Project', projectSchema);
