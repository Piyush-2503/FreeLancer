import mongoose from 'mongoose';

const applicantSchema = new mongoose.Schema({
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerName: { type: String, required: true },
  freelancerEmail: { type: String, required: true },
  field: { type: String, trim: true },
  resumeUrl: { type: String },
  resumeFileName: { type: String },
  note: { type: String, trim: true },
  appliedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['applied', 'shortlisted', 'rejected'], default: 'applied' },
});

const opportunitySchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyName: { type: String, required: true, trim: true },
  companyEmail: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true }, // Role they want to hire
  description: { type: String, required: true, trim: true }, // Job description
  budget: { type: Number, required: true, min: 0 }, // in paise
  field: { type: String, required: true, trim: true }, // Field / specialization
  status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  applicants: [applicantSchema],
}, { timestamps: true });

opportunitySchema.index({ status: 1, createdAt: -1 });
opportunitySchema.index({ field: 1 });

export const Opportunity = mongoose.model('Opportunity', opportunitySchema);
