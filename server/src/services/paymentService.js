import crypto from 'crypto';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Client } from '../models/Client.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export async function generatePaymentLink(ownerId, invoiceId) {
  const invoice = await Invoice.findOne({ _id: invoiceId, owner: ownerId });
  if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
  if (!['sent', 'overdue'].includes(invoice.status)) {
    throw new AppError('Invoice must be sent before creating a payment link', 409, 'INVALID_STATUS');
  }

  // Return existing link if amount hasn't changed
  if (invoice.paymentLinkId && invoice.paymentLinkUrl) {
    return { paymentLinkId: invoice.paymentLinkId, paymentLinkUrl: invoice.paymentLinkUrl };
  }

  const client = await Client.findById(invoice.client);

  // Lazy-load Razorpay to avoid startup failures with placeholder keys
  let link;
  try {
    const Razorpay = (await import('razorpay')).default;
    const rzp = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });

    if (!env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')) {
      throw new AppError('Only test-mode Razorpay keys are permitted', 500, 'LIVE_KEY_FORBIDDEN');
    }

    link = await rzp.paymentLink.create({
      amount: invoice.total,
      currency: 'INR',
      accept_partial: false,
      reference_id: invoice._id.toString(),
      description: `Invoice ${invoice.invoiceNumber}`,
      customer: { name: client?.name || 'Client', email: client?.email || '', contact: client?.phone || '' },
      notify: { sms: false, email: false },
      upi_link: true,
      callback_url: `${env.CLIENT_URL}/portal/invoices/${invoice._id}`,
      callback_method: 'get',
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Razorpay payment link creation failed', { error: err.message });
    throw new AppError('Failed to create payment link: ' + err.message, 502, 'PAYMENT_LINK_ERROR');
  }

  invoice.paymentLinkId = link.id;
  invoice.paymentLinkUrl = link.short_url;
  await invoice.save();

  return { paymentLinkId: link.id, paymentLinkUrl: link.short_url };
}

export async function handleWebhook(rawBody, signature) {
  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET || 'placeholder')
    .update(rawBody)
    .digest('hex');

  const valid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!valid) throw new AppError('Invalid webhook signature', 400, 'INVALID_SIGNATURE');

  const event = JSON.parse(rawBody.toString());
  const eventId = event.id || '';

  if (event.event !== 'payment_link.paid') {
    logger.info('Razorpay webhook: ignored event', { event: event.event });
    return { ignored: true };
  }

  const paymentLinkId = event.payload?.payment_link?.entity?.id;
  const paymentId = event.payload?.payment?.entity?.id;
  const amount = event.payload?.payment?.entity?.amount;
  const method = event.payload?.payment?.entity?.method;

  // Idempotency: check if already processed
  const existingPayment = await Payment.findOne({ razorpayPaymentId: paymentId });
  if (existingPayment) {
    logger.info('Webhook: duplicate payment event ignored', { paymentId });
    return { duplicate: true };
  }

  // Find invoice by payment link ID
  const invoice = await Invoice.findOne({ paymentLinkId });
  if (!invoice) {
    logger.warn('Webhook: no invoice found for payment link', { paymentLinkId });
    return { notFound: true };
  }

  // Validate amount matches
  if (amount !== invoice.total) {
    logger.warn('Webhook: amount mismatch', { expected: invoice.total, received: amount });
    throw new AppError('Payment amount does not match invoice total', 400, 'AMOUNT_MISMATCH');
  }

  // Create payment record and mark invoice as paid
  await Payment.create({
    invoice: invoice._id,
    owner: invoice.owner,
    razorpayPaymentId: paymentId,
    razorpayPaymentLinkId: paymentLinkId,
    amount,
    method,
    status: 'captured',
    razorpayEventId: eventId,
    rawWebhookPayload: event,
  });

  invoice.status = 'paid';
  invoice.paidAt = new Date();
  await invoice.save();

  logger.info('Invoice marked as paid via webhook', { invoiceId: invoice._id, paymentId });
  return { success: true };
}
