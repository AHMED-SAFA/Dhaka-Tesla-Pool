import nodemailer from "nodemailer";
import { env, isDev } from "../config/env.js";

let transporter;
const BRAND = "Dhaka Tesla Pool";
const ACCENT = "#0f172a"; // slate-900, flat — no gradient
const MUTED = "#64748b";

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

async function sendMail({ to, subject, text, html }) {
  const mailer = getTransporter();
  if (!mailer) {
    if (isDev) {
      console.info(
        `[mailer] SMTP is not configured; skipped email to ${to}: ${subject}`,
      );
      return { mocked: true };
    }
    throw new Error("SMTP is not configured. Set SMTP_USER and SMTP_PASS.");
  }

  const info = await mailer.sendMail({
    from: env.mailFrom,
    to,
    subject,
    text,
    html,
  });

  return { mocked: false, messageId: info.messageId };
}

function renderEmailShell({ preheader = "", title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;border-bottom:1px solid #f1f1f2;">
              <span style="font-size:17px;font-weight:700;color:${ACCENT};letter-spacing:-0.2px;">${BRAND}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #f1f1f2;">
              <p style="margin:0;font-size:12px;color:${MUTED};">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:${MUTED};">© ${new Date().getFullYear()} ${BRAND}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(label, url) {
  return `<a href="${url}" style="display:inline-block;padding:12px 24px;background:${ACCENT};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${label}</a>`;
}

// --- emails --------------------------------------------------------------

export async function sendVerificationEmail({ to, name, code, verifyUrl }) {
  const subject = `Verify your ${BRAND} email`;
  const text = `Hi ${name},\n\nYour verification code is ${code}.\nIt expires in 15 minutes.\n\nOr open: ${verifyUrl}\n`;

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:${ACCENT};">Verify your email</h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${MUTED};">Hi ${name}, use the code below to verify your account. It expires in 15 minutes.</p>
    <div style="margin:0 0 24px;padding:18px;background:#f8fafc;border:1px solid #e4e4e7;border-radius:10px;text-align:center;">
      <span style="font-size:30px;font-weight:700;letter-spacing:8px;color:${ACCENT};">${code}</span>
    </div>
    <div style="text-align:center;margin-bottom:8px;">${button("Verify email", verifyUrl)}</div>
    <p style="margin:16px 0 0;font-size:12px;color:${MUTED};text-align:center;">Or paste this link: <br/><span style="word-break:break-all;color:${ACCENT};">${verifyUrl}</span></p>
  `;

  const html = renderEmailShell({
    preheader: `Your code: ${code}`,
    title: subject,
    bodyHtml,
  });
  return sendMail({ to, subject, text, html });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const subject = `Reset your ${BRAND} password`;
  const text = `Hi ${name},\n\nReset your password (valid 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.\n`;

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:${ACCENT};">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${MUTED};">Hi ${name}, click below to set a new password. This link is valid for 1 hour.</p>
    <div style="text-align:center;margin-bottom:8px;">${button("Reset password", resetUrl)}</div>
    <p style="margin:16px 0 0;font-size:12px;color:${MUTED};text-align:center;">Or paste this link: <br/><span style="word-break:break-all;color:${ACCENT};">${resetUrl}</span></p>
  `;

  const html = renderEmailShell({
    preheader: "Reset your password",
    title: subject,
    bodyHtml,
  });
  return sendMail({ to, subject, text, html });
}
