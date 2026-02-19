const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { getAuthorizedGoogleClient } = require('./google');

function buildRawEmail({ to, subject, html }) {
  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html
  ];
  const raw = lines.join('\n');
  return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendViaGmail(userId, to, subject, html) {
  const client = await getAuthorizedGoogleClient(userId);
  if (!client) return false;
  const gmail = google.gmail({ version: 'v1', auth: client });
  const raw = buildRawEmail({ to, subject, html });
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  });
  return true;
}

async function sendViaSmtp(to, subject, html) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html
  });
}

async function sendEmail({ userId, to, subject, html }) {
  const sent = await sendViaGmail(userId, to, subject, html).catch(() => false);
  if (sent) return;
  if (!process.env.SMTP_HOST) {
    throw new Error('No email transport configured');
  }
  await sendViaSmtp(to, subject, html);
}

module.exports = { sendEmail };
