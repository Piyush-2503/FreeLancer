import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  address: { type: String, trim: true },
  notes: { type: String, trim: true },
  archivedAt: { type: Date, default: null },
  portalTokenHash: { type: String, select: false },
  portalTokenExpiresAt: { type: Date },
  lastPortalViewAt: { type: Date, default: null },
}, { timestamps: true });

clientSchema.index({ owner: 1, name: 1 });
clientSchema.index({ owner: 1, email: 1 });
clientSchema.index({ owner: 1, archivedAt: 1 });

export const Client = mongoose.model('Client', clientSchema);
