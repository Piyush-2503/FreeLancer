import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayPaymentId: { type: String, required: true, unique: true },
  razorpayPaymentLinkId: { type: String },
  amount: { type: Number, required: true }, // paise
  method: { type: String },
  status: { type: String, default: 'captured' },
  razorpayEventId: { type: String },        // for idempotency
  rawWebhookPayload: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

paymentSchema.index({ invoice: 1 });
paymentSchema.index({ razorpayEventId: 1 }, { sparse: true });

export const Payment = mongoose.model('Payment', paymentSchema);
