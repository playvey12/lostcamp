import fs from 'fs/promises';

// Email delivery via Resend's HTTP API (https://resend.com) instead of SMTP.
//
// Why: SMTP (ports 465/587) is blocked outbound on a lot of hosting
// providers, which made every send hang and then fail with
// ETIMEDOUT/"Connection timeout" no matter how correct SMTP_USER/SMTP_PASS
// were. Resend is a plain HTTPS POST (port 443), which is essentially
// never blocked, so this sidesteps the whole class of problem.
//
// Required env vars:
//   RESEND_API_KEY    - API key from https://resend.com/api-keys
//   MAIL_FROM_EMAIL   - sender address, must be on a domain verified in
//                       Resend (https://resend.com/domains). For quick
//                       testing without your own domain you can use
//                       "onboarding@resend.dev", but Resend then only
//                       lets you send to the email address you signed up
//                       with - fine for testing, not for real customers.
//
// Existing optional var:
//   ADMIN_NOTIFY_EMAIL - where admin notifications (new orders, contact
//                        form, reviews) are sent. Falls back to
//                        MAIL_FROM_EMAIL if not set.

const RESEND_API_URL = 'https://api.resend.com/emails';

export function getMailFromEmail(): string {
  return process.env.MAIL_FROM_EMAIL || '';
}

export function getResendApiKey(): string {
  return process.env.RESEND_API_KEY || '';
}

// Kept as smtpUser/smtpPass (rather than renamed) so every route that
// already does `if (smtpUser && smtpPass)` to check "is mail configured"
// keeps working unchanged. smtpUser is now the verified sender address,
// smtpPass is now the Resend API key.
export const smtpUser = getMailFromEmail();
export const smtpPass = getResendApiKey();

export function isMailConfigured(): boolean {
  return Boolean(getMailFromEmail() && getResendApiKey());
}

export interface MailAttachment {
  filename: string;
  path: string;
}

interface SendMailOptions {
  from?: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: MailAttachment[];
}

async function buildResendAttachments(attachments?: MailAttachment[]) {
  if (!attachments || attachments.length === 0) return undefined;
  return Promise.all(
    attachments.map(async (att) => {
      const buffer = await fs.readFile(att.path);
      return { filename: att.filename, content: buffer.toString('base64') };
    })
  );
}

async function sendViaResend(options: SendMailOptions): Promise<any> {
  const apiKey = getResendApiKey();
  const fromEmail = getMailFromEmail();

  if (!apiKey || !fromEmail) {
    throw new Error('Resend is not configured (RESEND_API_KEY / MAIL_FROM_EMAIL missing)');
  }

  const payload: Record<string, any> = {
    from: options.from || `"LOST CAMP Tactical" <${fromEmail}>`,
    to: [options.to],
    subject: options.subject,
  };
  if (options.html) payload.html = options.html;
  if (options.text) payload.text = options.text;

  const attachments = await buildResendAttachments(options.attachments);
  if (attachments) payload.attachments = attachments;

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}) as any);

  if (!res.ok) {
    const message =
      (data && (data.message || data.error?.message || data.error)) ||
      `Resend API error (HTTP ${res.status})`;
    throw new Error(message);
  }

  return data;
}

// Same shape as before (nodemailer-style transporter) so every existing
// call site — transporter.sendMail(options) or
// transporter.sendMail(options, callback) — keeps working unchanged.
export const transporter = {
  sendMail: (options: any, callback?: (err: Error | null, info?: any) => void): Promise<any> | void => {
    const promise = sendViaResend(options);
    if (callback) {
      promise.then((info) => callback(null, info)).catch((err) => callback(err));
      return;
    }
    return promise;
  },
};

export function escapeHtml(input: string | undefined | null): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function notifyAdmin(
  subject: string,
  html: string,
  attachments?: MailAttachment[]
): Promise<void> {
  const fromEmail = getMailFromEmail();
  const recipient = process.env.ADMIN_NOTIFY_EMAIL || fromEmail;

  if (!isMailConfigured() || !recipient) {
    console.log(`[ADMIN NOTIFY DEV FALLBACK] Subject: "${subject}"`);
    return;
  }

  try {
    await sendViaResend({
      to: recipient,
      subject,
      html,
      attachments,
    });
    console.log(`[ADMIN NOTIFY SUCCESS] Sent email "${subject}" to ${recipient}`);
  } catch (err) {
    console.error(`[ADMIN NOTIFY ERROR] Failed to send "${subject}":`, err);
  }
}
