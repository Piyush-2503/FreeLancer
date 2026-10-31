import cron from 'node-cron';
import { Invoice } from '../models/Invoice.js';
import { ReminderLog } from '../models/ReminderLog.js';
import { Client } from '../models/Client.js';
import { sendMail } from '../config/mailer.js';
import { formatINR } from '../utils/money.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Reminder schedule: days relative to due date (negative = before, positive = after)
const REMINDER_SCHEDULE = [
  { type: '3_days_before', offset: -3 },
  { type: 'due_today', offset: 0 },
  { type: '3_days_overdue', offset: 3 },
  { type: '7_days_overdue', offset: 7 },
  { type: '14_days_overdue', offset: 14 },
];

function getDaysDiff(dueDate) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const due = new Date(Date.UTC(
    dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()
  ));
  return Math.round((today - due) / 86400000); // positive = overdue by N days
}

function emailTemplate(invoice, client, type) {
  const daysOverdue = getDaysDiff(invoice.dueDate);
  const amount = formatINR(invoice.total);
  const dueStr = new Date(invoice.dueDate).toLocaleDateString('en-IN');
  const payLink = invoice.paymentLinkUrl ? `<a href="${invoice.paymentLinkUrl}">Pay Now</a>` : '';

  const messages = {
    '3_days_before': {
      subject: `[FreelanceHub] Invoice ${invoice.invoiceNumber} due in 3 days`,
      heading: 'Payment Reminder',
      body: `Your invoice ${invoice.invoiceNumber} for ${amount} is due on ${dueStr}. Please make payment at your earliest convenience.`,
    },
    'due_today': {
      subject: `[FreelanceHub] Invoice ${invoice.invoiceNumber} is due today`,
      heading: 'Payment Due Today',
      body: `Invoice ${invoice.invoiceNumber} for ${amount} is due today (${dueStr}). Please process your payment to avoid late charges.`,
    },
    '3_days_overdue': {
      subject: `[FreelanceHub] Invoice ${invoice.invoiceNumber} is 3 days overdue`,
      heading: 'Overdue Payment Notice',
      body: `Invoice ${invoice.invoiceNumber} for ${amount} was due on ${dueStr} and is now 3 days overdue. Please remit payment immediately.`,
    },
    '7_days_overdue': {
      subject: `[FreelanceHub] Invoice ${invoice.invoiceNumber} is 7 days overdue`,
      heading: 'Urgent: Overdue Invoice',
      body: `Invoice ${invoice.invoiceNumber} for ${amount} is now 7 days overdue. Immediate payment is required to avoid further action.`,
    },
    '14_days_overdue': {
      subject: `[FreelanceHub] Final Reminder: Invoice ${invoice.invoiceNumber} (14 days overdue)`,
      heading: 'Final Overdue Notice',
      body: `This is a final reminder that invoice ${invoice.invoiceNumber} for ${amount} is 14 days overdue. Please contact us immediately.`,
    },
  };

  const msg = messages[type];
  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
      <h1 style="color: #1E293B; font-size: 20px; margin-bottom: 4px;">${msg.heading}</h1>
      <p style="color: #475569; font-size: 14px;">Dear ${client.name},</p>
      <p style="color: #0F172A; font-size: 14px;">${msg.body}</p>
      ${payLink ? `<p style="margin-top: 24px;">${payLink}</p>` : ''}
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
      <p style="color: #64748B; font-size: 12px;">FreelanceHub — automated payment reminder. If you have already paid, please disregard this email.</p>
    </div>`;

  const text = `${msg.heading}\n\nDear ${client.name},\n\n${msg.body}\n\n${invoice.paymentLinkUrl ? 'Pay online: ' + invoice.paymentLinkUrl : ''}\n\nFreelanceHub`;
  return { subject: msg.subject, html, text };
}

export async function runReminderJob() {
  logger.info('Running payment reminder job');
  const now = new Date();

  // Find all unpaid invoices (sent or overdue)
  const invoices = await Invoice.find({ status: { $in: ['sent', 'overdue'] } });

  for (const invoice of invoices) {
    const daysFromDue = getDaysDiff(invoice.dueDate);

    // Determine which reminder applies NOW (most recent applicable)
    let applicableType = null;
    for (const schedule of REMINDER_SCHEDULE) {
      if (daysFromDue >= schedule.offset) {
        applicableType = schedule.type;
      }
    }
    if (!applicableType) continue;

    // Check if already sent
    const alreadySent = await ReminderLog.findOne({ invoice: invoice._id, type: applicableType, status: 'sent' });
    if (alreadySent) continue;

    // Mark overdue
    if (daysFromDue > 0 && invoice.status !== 'overdue') {
      invoice.status = 'overdue';
      await invoice.save();
    }

    const client = await Client.findById(invoice.client);
    if (!client?.email) {
      logger.warn('No client email for reminder', { invoiceId: invoice._id });
      continue;
    }

    const { subject, html, text } = emailTemplate(invoice, client, applicableType);
    let logEntry;
    try {
      const result = await sendMail({ to: client.email, subject, html, text });
      logEntry = await ReminderLog.create({
        invoice: invoice._id,
        client: client._id,
        type: applicableType,
        sentAt: new Date(),
        status: 'sent',
        previewUrl: result.previewUrl || null,
      });
      if (result.previewUrl) {
        logger.info('Reminder sent (Ethereal preview)', { type: applicableType, previewUrl: result.previewUrl });
      }
    } catch (err) {
      logger.error('Reminder send failed', { invoiceId: invoice._id, type: applicableType, error: err.message });
      await ReminderLog.create({
        invoice: invoice._id,
        client: client._id,
        type: applicableType,
        status: 'failed',
        error: err.message,
      }).catch(() => {});
    }
  }

  logger.info('Reminder job completed');
}

export function startReminderCron() {
  const expression = env.CRON_REMINDER || '0 8 * * *';
  cron.schedule(expression, () => {
    runReminderJob().catch(err => logger.error('Reminder job error', { error: err.message }));
  });
  logger.info('Reminder cron scheduled', { expression });
}
