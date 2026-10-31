import { AppError } from './errorHandler.js';

/**
 * CSRF protection via custom header check.
 * All state-changing requests (POST, PATCH, PUT, DELETE) must include
 * the X-Requested-With header. The frontend Axios instance always sets this.
 * Combined with strict CORS, this prevents cross-origin form submissions.
 */
export function csrfProtection(req, res, next) {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    // Exempt the Razorpay webhook route (it doesn't use the Axios client)
    if (req.path === '/api/v1/webhooks/razorpay') return next();
    if (!req.headers['x-requested-with']) {
      return next(new AppError('Missing X-Requested-With header', 403, 'CSRF_PROTECTION'));
    }
  }
  next();
}
