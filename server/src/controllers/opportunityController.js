import { z } from 'zod';
import { Opportunity } from '../models/Opportunity.js';
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

export const opportunityQuerySchema = z.object({
  query: z.object({
    page: z.union([z.string(), z.number()]).optional().transform(v => v ? parseInt(String(v), 10) : 1),
    limit: z.union([z.string(), z.number()]).optional().transform(v => v ? Math.min(parseInt(String(v), 10), 100) : 20),
    field: z.string().optional(),
    search: z.string().optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const createOpportunitySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Role/Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(5000),
    budget: z.union([z.number(), z.string()]),
    field: z.string().min(1, 'Field is required').max(100),
  }),
});

export const applyOpportunitySchema = z.object({
  body: z.object({
    note: z.string().max(1000).optional(),
    resumeUrl: z.string().optional(),
    resumeFileName: z.string().optional(),
  }),
});

export async function listOpportunities(req, res, next) {
  try {
    const { page = 1, limit = 20, field, search } = req.validated.query;
    const query = { status: 'open' };

    if (field && field !== 'all' && field !== '') {
      query.field = { $regex: new RegExp(`^${field}$`, 'i') };
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { companyName: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [opportunities, total] = await Promise.all([
      Opportunity.find(query)
        .select('-applicants')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Opportunity.countDocuments(query),
    ]);

    return sendSuccess(res, { opportunities }, 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyOpportunities(req, res, next) {
  try {
    const opportunities = await Opportunity.find({ company: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, { opportunities });
  } catch (err) {
    next(err);
  }
}

export async function createOpportunity(req, res, next) {
  try {
    const { title, description, budget, field } = req.validated.body;
    const budgetPaise = Math.round(Number(budget) * 100);

    const opportunity = await Opportunity.create({
      company: req.user._id,
      companyName: req.user.businessName || req.user.name,
      companyEmail: req.user.email,
      title,
      description,
      budget: budgetPaise,
      field,
      status: 'open',
    });

    return sendSuccess(res, { opportunity }, 201);
  } catch (err) {
    next(err);
  }
}

export async function applyOpportunity(req, res, next) {
  try {
    const { id } = req.params;
    const { note, resumeUrl, resumeFileName } = req.validated.body;

    const opportunity = await Opportunity.findById(id);
    if (!opportunity || opportunity.status !== 'open') {
      throw new AppError('Opportunity not found or closed', 404, 'NOT_FOUND');
    }

    // Check if already applied
    const alreadyApplied = opportunity.applicants.some(
      a => a.freelancer.toString() === req.user._id.toString()
    );
    if (alreadyApplied) {
      throw new AppError('You have already applied to this opportunity', 409, 'ALREADY_APPLIED');
    }

    const application = {
      freelancer: req.user._id,
      freelancerName: req.user.name,
      freelancerEmail: req.user.email,
      field: req.user.field,
      resumeUrl: resumeUrl || req.user.resumeUrl,
      resumeFileName: resumeFileName || req.user.resumeFileName || 'Resume.pdf',
      note: note || '',
      appliedAt: new Date(),
      status: 'applied',
    };

    opportunity.applicants.push(application);
    await opportunity.save();

    return sendSuccess(res, { message: 'Application submitted successfully', application }, 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteOpportunity(req, res, next) {
  try {
    const { id } = req.params;
    const opp = await Opportunity.findOneAndDelete({ _id: id, company: req.user._id });
    if (!opp) throw new AppError('Opportunity not found', 404, 'NOT_FOUND');
    return sendSuccess(res, { message: 'Opportunity deleted' });
  } catch (err) {
    next(err);
  }
}
