import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['freelancer', 'company'], default: 'freelancer', index: true },
  field: { type: String, trim: true },
  resumeUrl: { type: String },
  resumeFileName: { type: String },
  companyProfile: {
    hiringRole: { type: String, trim: true },
    jobDescription: { type: String, trim: true },
    budget: { type: Number, default: 0 },
  },
  businessName: { type: String, trim: true },
  address: { type: String, trim: true },
  gstin: { type: String, trim: true },
  upiId: { type: String, trim: true },
  defaultCurrency: { type: String, default: 'INR' },
  defaultTaxRate: { type: Number, default: 18 },
  defaultPaymentTermsDays: { type: Number, default: 30 },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
