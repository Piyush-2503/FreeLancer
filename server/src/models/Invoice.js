import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 }, // paise
  amount: { type: Number, required: true, min: 0 },    // paise = qty * unitPrice
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  invoiceNumber: { type: String, required: true },
  lineItems: [lineItemSchema],
  subtotal: { type: Number, required: true },   // paise
  taxRate: { type: Number, required: true },     // percentage, e.g. 18
  taxAmount: { type: Number, required: true },   // paise
  total: { type: Number, required: true },       // paise
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
    index: true,
  },
  timeEntries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TimeEntry' }],
  paymentLinkId: { type: String },
  paymentLinkUrl: { type: String },
  paidAt: { type: Date },
  notes: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });

// Atomic counter per owner for sequential invoice numbers
const counterSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  seq: { type: Number, default: 0 },
});

invoiceSchema.index({ owner: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ owner: 1, status: 1 });
invoiceSchema.index({ owner: 1, client: 1 });
invoiceSchema.index({ owner: 1, dueDate: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
export const InvoiceCounter = mongoose.model('InvoiceCounter', counterSchema);
