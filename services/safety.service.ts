import { db } from '@/lib/db';

/**
 * Safety Service
 * Blocking and reporting. Block is unilateral and gates DN threads, Connection
 * requests, and Explore visibility — it does not retroactively sever an
 * existing ACCEPTED Connection or Collab access (a separate "disconnect"
 * feature, out of scope here).
 */
export class SafetyService {
  /** True if either user has blocked the other. */
  static async isBlocked(userIdA: string, userIdB: string): Promise<boolean> {
    const block = await db.block.findFirst({
      where: {
        OR: [
          { blockerId: userIdA, blockedId: userIdB },
          { blockerId: userIdB, blockedId: userIdA },
        ],
      },
    });
    return !!block;
  }

  static async block(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) {
      throw new Error('Cannot block yourself');
    }

    return await db.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId, reason: reason?.trim() || null },
    });
  }

  static async unblock(blockerId: string, blockedId: string) {
    await db.block.deleteMany({ where: { blockerId, blockedId } });
  }

  static async getBlockedUsers(blockerId: string) {
    return await db.block.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: { id: true, name: true, avatar: true, title: true, company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createReport(
    reporterId: string,
    reportedUserId: string,
    context: 'DIRECT_NOTE' | 'PROFILE' | 'MESSAGE',
    reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'FAKE_PROFILE' | 'OTHER',
    contextId?: string,
    details?: string
  ) {
    if (reporterId === reportedUserId) {
      throw new Error('Cannot report yourself');
    }

    return await db.report.create({
      data: {
        reporterId,
        reportedUserId,
        context,
        contextId: contextId || null,
        reason,
        details: details?.trim() || null,
      },
    });
  }
}
