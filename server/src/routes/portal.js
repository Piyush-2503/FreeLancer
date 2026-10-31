import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authenticatePortal } from '../services/portalService.js';
import { generatePortalLink, revokePortalLink } from '../controllers/portalController.js';
import {
  createPortalSession, portalLogout, getPortalMe,
  getPortalProjects, getPortalProject,
  getPortalInvoices, getPortalInvoice, downloadPortalInvoicePDF,
  getPortalMessages, postPortalMessage,
  messageBodySchema,
} from '../controllers/portalController.js';
import { generatePaymentLink } from '../services/paymentService.js';
import { sendSuccess } from '../utils/response.js';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const router = Router();

const portalSessionLimiter = env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// Freelancer generates portal link for a client
router.post('/clients/:id/portal-link', authenticate, generatePortalLink);
router.delete('/clients/:id/portal-link', authenticate, revokePortalLink);

// Portal session management (no auth)
router.post('/portal/session', portalSessionLimiter, createPortalSession);
router.post('/portal/logout', portalLogout);

// Portal protected routes
router.get('/portal/me', authenticatePortal, getPortalMe);
router.get('/portal/projects', authenticatePortal, getPortalProjects);
router.get('/portal/projects/:id', authenticatePortal, getPortalProject);
router.get('/portal/invoices', authenticatePortal, getPortalInvoices);
router.get('/portal/invoices/:id', authenticatePortal, getPortalInvoice);
router.get('/portal/invoices/:id/pdf', authenticatePortal, downloadPortalInvoicePDF);
router.get('/portal/projects/:id/messages', authenticatePortal, getPortalMessages);
router.post('/portal/projects/:id/messages', authenticatePortal, validate(messageBodySchema), postPortalMessage);

// Payment link (accessible by freelancer)
router.post('/invoices/:id/payment-link', authenticate, async (req, res, next) => {
  try {
    const result = await generatePaymentLink(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
});

export default router;
