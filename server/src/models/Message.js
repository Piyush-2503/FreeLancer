import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderType: { type: String, enum: ['freelancer', 'client'], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true }, // User._id or Client._id
  senderName: { type: String, required: true },
  body: { type: String, required: true, maxlength: 2000 },
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

messageSchema.index({ project: 1, sentAt: 1 });
messageSchema.index({ owner: 1 });

export const Message = mongoose.model('Message', messageSchema);
