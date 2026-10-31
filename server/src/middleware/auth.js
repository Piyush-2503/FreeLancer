import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';
import { User } from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = req.cookies?.authToken || req.cookies?.token || bearerToken;
    if (!token) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select('-passwordHash');
    if (!user) throw new AppError('User not found', 401, 'UNAUTHORIZED');
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
  }
}
