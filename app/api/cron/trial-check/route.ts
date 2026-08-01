import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTrialReminderEmail, sendTrialExpiredEmail } from '@/lib/email';
import { triggerNotification } from '@/lib/novu';
import { estimateMonthlyCents } from '@/lib/oroslate/tiers';

/**
 * Daily Vercel Cron (see vercel.json) that drives the trial banner/email
 * sequence: a day-3 "gentle reminder", a day-1 "urgency" push, and a
 * same-day "trial expired" notice once trialEndsAt has passed. Each stage
 * has its own idempotency marker on Subscription so a re-run never
 * double-sends.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  let remindersSent = 0;
  let expiredSent = 0;

  // Stage 1 — reminder window: trial ends within the next 3 days and no
  // reminder has been sent yet.
  const dueForReminder = await db.subscription.findMany({
    where: {
      status: 'TRIALING',
      trialEndsAt: { gte: now, lte: threeDaysFromNow },
      trialReminderSentAt: null,
    },
    include: { organization: { include: { owner: { select: { email: true, name: true } } } } },
  });

  for (const subscription of dueForReminder) {
    if (!subscription.trialEndsAt) continue;
    const daysLeft = Math.max(1, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    const upgradeUrl = `${baseUrl}/oroslate/org/${subscription.organizationId}/upgrade`;
    const estimateCents = estimateMonthlyCents('PRO', subscription.seatCount);

    await sendTrialReminderEmail(
      subscription.organization.owner.email,
      subscription.organization.name,
      daysLeft,
      upgradeUrl,
      estimateCents !== null
        ? { baseFeeCents: estimateCents - 1000 * subscription.seatCount, seatCount: subscription.seatCount, seatFeeCents: 1000 }
        : null
    );
    await triggerNotification('oroslate-trial-reminder', subscription.organization.ownerId, {
      organizationName: subscription.organization.name,
      daysLeft,
      upgradeUrl,
    });
    await db.subscription.update({
      where: { id: subscription.id },
      data: { trialReminderSentAt: now },
    });
    remindersSent++;
  }

  // Stage 2 — trial has expired: lock the workspace (enforced at read-time
  // in getSlate/SlatePage) and send the expiry notice once.
  const dueForExpiry = await db.subscription.findMany({
    where: {
      status: 'TRIALING',
      trialEndsAt: { lt: now },
      trialExpiredEmailSentAt: null,
    },
    include: { organization: { include: { owner: { select: { email: true, name: true } } } } },
  });

  for (const subscription of dueForExpiry) {
    const upgradeUrl = `${baseUrl}/oroslate/org/${subscription.organizationId}/upgrade`;

    await sendTrialExpiredEmail(subscription.organization.owner.email, subscription.organization.name, upgradeUrl);
    await triggerNotification('oroslate-trial-expired', subscription.organization.ownerId, {
      organizationName: subscription.organization.name,
      upgradeUrl,
    });
    await db.subscription.update({
      where: { id: subscription.id },
      data: { trialExpiredEmailSentAt: now },
    });
    expiredSent++;
  }

  return NextResponse.json({ remindersSent, expiredSent });
}
