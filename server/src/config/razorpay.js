import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let razorpay = null;

export function getRazorpay() {
  if (!razorpay) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    // Enforce test-mode key at startup
    if (!env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
      logger.error('FATAL: Razorpay key must start with rzp_test_. Live keys are not permitted.');
      process.exit(1);
    }
    // Dynamic import to support placeholder keys
    const Razorpay = (await import('razorpay')).default;
    razorpay = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  }
  return razorpay;
}

export async function createPaymentLink(invoice, client) {
  const rzp = getRazorpay();
  const link = await rzp.paymentLink.create({
    amount: invoice.total, // already in paise
    currency: 'INR',
    accept_partial: false,
    reference_id: invoice._id.toString(),
    description: `Payment for Invoice ${invoice.invoiceNumber}`,
    customer: {
      name: client.name,
      email: client.email || '',
      contact: client.phone || '',
    },
    notify: { sms: false, email: !!client.email },
    upi_link: true, // enable UPI
    callback_url: `${env.CLIENT_URL}/portal/invoices/${invoice._id}`,
    callback_method: 'get',
  });
  return link;
}
