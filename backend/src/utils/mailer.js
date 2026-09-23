import nodemailer from 'nodemailer';
import { env, isDev } from '../config/env.js';

let transporter;

function getTransporter() {
  if (!env.smtpUser || !env.smtpPass) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) {
    if (isDev) {
      console.warn('[mail] SMTP_USER / SMTP_PASS not set. Email dumped to console.');
      console.warn({ to, subject, text });
      return { mocked: true };
    }
    throw new Error('Email is not configured.');
  }

  await transport.sendMail({
    from: env.mailFrom,
    to,
    subject,
    text,
    html,
  });
  return { mocked: false };
}

export async function sendVerificationEmail({ to, name, code, verifyUrl }) {
  const subject = 'Verify your Dhaka Tesla Pool email';
  const text = `Hi ${name},\n\nYour verification code is ${code}.\nIt expires in 15 minutes.\n\nOr open: ${verifyUrl}\n`;
  const html = `
    <p>Hi ${name},</p>
    <p>Your Dhaka Tesla Pool verification code is:</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
    <p>This code expires in 15 minutes.</p>
    <p><a href="${verifyUrl}">Verify email</a></p>
  `;
  return sendMail({ to, subject, text, html });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const subject = 'Reset your Dhaka Tesla Pool password';
  const text = `Hi ${name},\n\nReset your password (valid 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.\n`;
  const html = `
    <p>Hi ${name},</p>
    <p>You asked to reset your Dhaka Tesla Pool password. This link expires in 1 hour.</p>
    <p><a href="${resetUrl}">Reset password</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;
  return sendMail({ to, subject, text, html });
}
