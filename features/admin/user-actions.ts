'use server';

import { db } from '@/lib/db';
import { getAdminSession, requireSuperAdmin } from '@/lib/auth.admin';
import { logAdminAction } from '@/lib/adminAudit';
import { triggerNotification } from '@/lib/novu';
import { sendAdminNoticeEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error('Not authenticated as admin');
  return session.user.id;
}

export type AdminNoticeType = 'warning' | 'info' | 'changes';
const ADMIN_NOTICE_TYPES: AdminNoticeType[] = ['warning', 'info', 'changes'];

export async function setUserPaused(userId: string, isPaused: boolean) {
  const adminId = await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { isPaused } });
  logAdminAction(adminId, isPaused ? 'user.pause' : 'user.reactivate', { targetType: 'User', targetId: userId });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function bulkSetUserPaused(userIds: string[], isPaused: boolean) {
  const adminId = await requireAdmin();
  if (userIds.length === 0) return { success: true };

  await db.user.updateMany({ where: { id: { in: userIds } }, data: { isPaused } });
  logAdminAction(adminId, isPaused ? 'user.bulk_pause' : 'user.bulk_reactivate', {
    targetType: 'User',
    metadata: { userIds },
  });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function resolveFraudFlag(flagId: string) {
  const adminId = await requireAdmin();
  await db.fraudFlag.update({ where: { id: flagId }, data: { resolved: true } });
  logAdminAction(adminId, 'fraud_flag.resolve', { targetType: 'FraudFlag', targetId: flagId });
  revalidatePath('/admin/users');
  return { success: true };
}

// Sends the user a real email from noreply@orochat.com (same SMTP mailer as
// password-reset/verification) — the reliable channel, since it doesn't
// depend on a Novu workflow being configured or a subscriber email being
// linked. The Novu in-app notification is fired too, best-effort, so it
// also shows up in-app; its failure doesn't undo the email that already sent.
export async function sendUserMessage(userId: string, type: AdminNoticeType, subject: string, message: string) {
  const adminId = await requireAdmin();
  if (!ADMIN_NOTICE_TYPES.includes(type)) return { error: 'Invalid message type' };

  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();
  if (!trimmedSubject || !trimmedMessage) return { error: 'Subject and message are required' };

  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return { error: 'User not found' };

  try {
    await sendAdminNoticeEmail(user.email, type, trimmedSubject, trimmedMessage);
  } catch (error) {
    console.error('Failed to send admin notice email:', error);
    return { error: 'Failed to send email — check SMTP configuration' };
  }

  await triggerNotification('admin-notice', userId, { type, subject: trimmedSubject, message: trimmedMessage }, adminId);
  logAdminAction(adminId, 'user.message', { targetType: 'User', targetId: userId, metadata: { type, subject: trimmedSubject } });
  return { success: true };
}

// Permanently deletes the user row; Prisma's onDelete: Cascade rules take
// care of everything that hangs off it (messages, posts, connections, etc).
// Irreversible, so restricted to Super Admins — same bar as the other
// platform-wide destructive actions in this file's siblings.
export async function terminateUser(userId: string) {
  const adminId = await requireSuperAdmin();

  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (!user) return { error: 'User not found' };

  await db.user.delete({ where: { id: userId } });
  logAdminAction(adminId, 'user.terminate', {
    targetType: 'User',
    targetId: userId,
    metadata: { email: user.email, name: user.name },
  });
  revalidatePath('/admin/users');
  return { success: true };
}
