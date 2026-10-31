import nodemailer from 'nodemailer';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

export async function getMailer() {
  if (transporter) return transporter;

  if (env.SMTP_USER && env.SMTP_PASS && env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587'),
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  } else {
    // Auto-create Ethereal test account
    const account = await nodemailer.createTestAccount();
    logger.info('Ethereal test email account created', { user: account.user });
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: account.user, pass: account.pass },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  try {
    const mailer = await getMailer();
    const info = await mailer.sendMail({
      from: `"FreelanceHub" <noreply@freelancehub.app>`,
      to,
      subject,
      html,
      text,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info('Email preview URL (Ethereal)', { previewUrl, subject });
    }
    return { messageId: info.messageId, previewUrl };
  } catch (err) {
    logger.warn('Email delivery failed (simulated in dev/test)', { error: err.message, to, subject });
    return { messageId: 'simulated-' + Date.now(), previewUrl: null, simulated: true };
  }
}
