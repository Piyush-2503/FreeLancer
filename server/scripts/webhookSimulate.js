#!/usr/bin/env node
/**
 * Webhook simulation script for local testing.
 * Sends a correctly HMAC-signed sample Razorpay payment_link.paid payload
 * to the local webhook endpoint.
 *
 * Usage:
 *   npm run webhook:simulate
 *   INVOICE_ID=<id> PAYMENT_LINK_ID=<id> npm run webhook:simulate
 */
import crypto from 'crypto';
import http from 'http';

const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_webhook_secret';
const invoiceId = process.env.INVOICE_ID || '000000000000000000000001';
const paymentLinkId = process.env.PAYMENT_LINK_ID || 'plink_test_001';
const paymentId = process.env.PAYMENT_ID || `pay_test_${Date.now()}`;

const payload = JSON.stringify({
  id: `evt_${Date.now()}`,
  entity: 'event',
  event: 'payment_link.paid',
  payload: {
    payment_link: {
      entity: { id: paymentLinkId, reference_id: invoiceId }
    },
    payment: {
      entity: {
        id: paymentId,
        amount: 100000, // 1000 INR in paise — adjust to match actual invoice
        currency: 'INR',
        method: 'upi',
        status: 'captured',
      }
    }
  }
});

const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/webhooks/razorpay',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'X-Razorpay-Signature': signature,
    'X-Razorpay-Event-Id': `evt_${Date.now()}`,
  },
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', err => console.error('Error:', err.message));
req.write(payload);
req.end();
console.log('Webhook simulation sent. Signature:', signature.slice(0, 16) + '...');
