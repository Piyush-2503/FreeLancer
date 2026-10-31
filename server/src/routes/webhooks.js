import { Router } from 'express';
import { handleWebhook } from '../services/paymentService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Raw body parser is set on this route in app.js BEFORE global json parser
router.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) return sendError(res, 400, 'MISSING_SIGNATURE', 'Missing signature header');

    const result = await handleWebhook(req.body, signature);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message });
    if (err.statusCode === 400) return sendError(res, 400, err.code, err.message);
    return sendError(res, 500, 'WEBHOOK_ERROR', 'Webhook processing failed');
  }
});

export default router;
