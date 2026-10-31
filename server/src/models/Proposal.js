import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  scope: { type: String, required: true, trim: true, maxlength: 10000 },
  deliverables: { type: String, trim: true, maxlength: 5000 },
  price: { type: Number, required: true, min: 0 }, // paise
  validUntil: { type: Date, required: true },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft',
    index: true,
  },
  accessTokenHash: { type: String, select: false },
  accessTokenExpiresAt: { type: Date },
  respondedAt: { type: Date },
}, { timestamps: true });

proposalSchema.index({ owner: 1, status: 1 });
proposalSchema.index({ owner: 1, client: 1 });

export const Proposal = mongoose.model('Proposal', proposalSchema);
