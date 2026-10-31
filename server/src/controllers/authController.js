import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Opportunity } from '../models/Opportunity.js';
import { env } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

// Validation schemas
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address').transform(val => val.trim().toLowerCase()),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['freelancer', 'company']).optional().default('freelancer'),
    field: z.string().max(100).optional(),
    resumeUrl: z.string().optional(),
    resumeFileName: z.string().max(255).optional(),
    businessName: z.string().max(100).optional(),
    hiringRole: z.string().max(200).optional(),
    jobDescription: z.string().max(5000).optional(),
    budget: z.union([z.number(), z.string()]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').transform(val => val.trim().toLowerCase()),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    businessName: z.string().max(100).optional(),
    field: z.string().max(100).optional(),
    resumeUrl: z.string().optional(),
    resumeFileName: z.string().max(255).optional(),
    address: z.string().max(500).optional(),
    gstin: z.string().max(20).optional(),
    upiId: z.string().max(50).optional(),
    defaultCurrency: z.string().max(10).optional(),
    defaultTaxRate: z.number().min(0).max(100).optional(),
    defaultPaymentTermsDays: z.number().min(0).max(365).optional(),
  }),
});

function setCookieToken(res, token) {
  const cookieOpts = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  };
  res.cookie('authToken', token, cookieOpts);
  res.cookie('token', token, cookieOpts);
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function formatUser(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  return obj;
}

export async function register(req, res, next) {
  try {
    const {
      name, email, password, role = 'freelancer',
      field, resumeUrl, resumeFileName, businessName,
      hiringRole, jobDescription, budget,
    } = req.validated.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const budgetPaise = budget !== undefined && budget !== null && budget !== ''
      ? Math.round(Number(budget) * 100)
      : 0;

    const effectiveBusinessName = businessName || (role === 'company' ? name : undefined);

    const userData = {
      name,
      email,
      passwordHash,
      role,
      businessName: effectiveBusinessName,
      field: field || undefined,
      resumeUrl: resumeUrl || undefined,
      resumeFileName: resumeFileName || undefined,
    };

    if (role === 'company' && hiringRole) {
      userData.companyProfile = {
        hiringRole,
        jobDescription: jobDescription || '',
        budget: budgetPaise,
      };
    }

    const user = await User.create(userData);

    // If company specified a hiring role upon signup, create open Opportunity record
    if (role === 'company' && hiringRole) {
      await Opportunity.create({
        company: user._id,
        companyName: effectiveBusinessName || user.name,
        companyEmail: user.email,
        title: hiringRole,
        description: jobDescription || `Opportunity to work with ${effectiveBusinessName || user.name} as a ${hiringRole}.`,
        budget: budgetPaise,
        field: field || 'General',
        status: 'open',
      });
    }

    const token = signToken(user._id);
    setCookieToken(res, token);

    return sendSuccess(res, { user: formatUser(user), token }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = signToken(user._id);
    setCookieToken(res, token);

    return sendSuccess(res, { user: formatUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const clearOpts = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
    };
    res.clearCookie('authToken', clearOpts);
    res.clearCookie('token', clearOpts);
    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    return sendSuccess(res, { user: formatUser(req.user) });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const updates = req.validated.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    return sendSuccess(res, { user: formatUser(user) });
  } catch (err) {
    next(err);
  }
}
