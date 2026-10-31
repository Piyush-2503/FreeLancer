import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  register, login, logout, getMe, updateMe,
  registerSchema, loginSchema, updateMeSchema,
} from '../controllers/authController.js';
import { env } from '../config/env.js';

const router = Router();

const authLimiter = env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.NODE_ENV === 'production' ? 100 : 1000,
      message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
      standardHeaders: true,
      legacyHeaders: false,
    });

// Public routes
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', authenticate, logout);

// Protected routes
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate(updateMeSchema), updateMe);

export default router;
