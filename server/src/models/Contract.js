import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', default: null },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 50000 },
  bodyHash: { type: String }, // SHA-256 of body at signing time
  status: {
    type: String,
    enum: ['draft', 'sent', 'signed'],
    default: 'draft',
    index: true,
  },
  accessTokenHash: { type: String, select: false },
  accessTokenExpiresAt: { type: Date },
  signature: {
    imageData: { type: String },  // PNG data URL
    signerName: { type: String },
    signedAt: { type: Date },
    ipAddress: { type: String },
  },
  lockedAt: { type: Date },
}, { timestamps: true });

contractSchema.index({ owner: 1, status: 1 });
contractSchema.index({ owner: 1, client: 1 });

export const Contract = mongoose.model('Contract', contractSchema);
