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

function formatGBP(cents: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

export async function sendTrialReminderEmail(
  to: string,
  organizationName: string,
  daysLeft: number,
  upgradeUrl: string,
  estimate: { baseFeeCents: number; seatCount: number; seatFeeCents: number } | null
): Promise<void> {
  const totalCents = estimate ? estimate.baseFeeCents + estimate.seatFeeCents * estimate.seatCount : null;

  const html = emailLayout(
    'Keep your team moving',
    `
      <p>Hi there,</p>
      <p>
        Over the last few days, your team has turned connections into real-time execution on
        <strong>${organizationName}</strong>&rsquo;s Oroslate workspace. You&rsquo;ve unlocked unlimited chat
        history, managed complex timelines, and centralised your business operations right inside Orochat.
      </p>
      <p>Your Pro Slate trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. To keep your workflows running
      seamlessly, upgrade your workspace today.</p>
      ${
        totalCents !== null && estimate
          ? `<div style="background: #F0F3F7; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px;">
              <p style="margin: 0 0 6px;">Pro Slate Base: ${formatGBP(estimate.baseFeeCents)}/month</p>
              <p style="margin: 0 0 6px;">Team Seats (${estimate.seatCount} active): ${formatGBP(estimate.seatFeeCents * estimate.seatCount)}/month</p>
              <p style="margin: 0; font-weight: 600;">Total Estimated: ${formatGBP(totalCents)}/month</p>
            </div>`
          : ''
      }
      ${emailButton(upgradeUrl, 'Upgrade My Slate Now')}
      <p style="font-size: 13px; color: #666666;">Save 20% by switching to an annual plan at checkout.</p>
    `
  );
  await sendMail({ to, subject: `Your Oroslate trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`, html });
}

export async function sendTrialExpiredEmail(to: string, organizationName: string, upgradeUrl: string): Promise<void> {
  const html = emailLayout(
    'Action required: your trial has expired',
    `
      <p>Hi there,</p>
      <p>
        Today was the final day of <strong>${organizationName}</strong>&rsquo;s Oroslate Pro Trial. Your
        workspace has now been automatically paused.
      </p>
      <p style="font-weight: 600;">What happens to your data?</p>
      <p>
        Don&rsquo;t worry — your chat history, project boards, and team configuration are completely safe, but
        they&rsquo;ll stay locked until an upgrade is completed. Your team will temporarily lose access to their
        task tracking.
      </p>
      ${emailButton(upgradeUrl, 'Lock In Pro Access')}
    `
  );
  await sendMail({ to, subject: `Your Oroslate trial for ${organizationName} has expired`, html });
}
