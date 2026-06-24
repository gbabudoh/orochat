import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) throw new Error('SMTP is not configured');

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: false, // STARTTLS on 587, not implicit TLS
    requireTLS: true,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail(options: { to: string; subject: string; html: string; text?: string }): Promise<void> {
  const from = process.env.EMAIL_FROM || 'Orochat <noreply@orochat.com>';
  await getTransporter().sendMail({ from, ...options });
}

function emailLayout(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #333333;">
      <h1 style="color: #458B9E; font-size: 22px; margin: 0 0 24px;">Orochat</h1>
      <h2 style="font-size: 18px; margin: 0 0 16px;">${title}</h2>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #999999;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

function emailButton(url: string, label: string): string {
  return `
    <a href="${url}" style="display: inline-block; background-color: #458B9E; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0;">
      ${label}
    </a>
  `;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const html = emailLayout(
    'Reset your password',
    `
      <p>We received a request to reset the password for your Orochat account.</p>
      ${emailButton(resetUrl, 'Reset Password')}
      <p style="font-size: 13px; color: #666666;">This link expires in 1 hour.</p>
    `
  );
  await sendMail({ to, subject: 'Reset your Orochat password', html });
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const html = emailLayout(
    'Verify your email address',
    `
      <p>Thanks for signing up for Orochat! Please confirm your email address to activate your account.</p>
      ${emailButton(verifyUrl, 'Verify Email')}
      <p style="font-size: 13px; color: #666666;">This link expires in 24 hours.</p>
    `
  );
  await sendMail({ to, subject: 'Verify your Orochat email address', html });
}
