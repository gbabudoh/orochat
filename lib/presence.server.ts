import { db } from '@/lib/db';
import { resolvePresence, type PresenceStatus } from '@/lib/presence';

/**
 * Batch-resolves presence for a set of users (e.g. post authors in a feed),
 * mirroring the getPostMeta(postIds, userId) batch-fetch pattern used
 * elsewhere for per-post viewer data.
 */
export async function getPresenceMap(userIds: string[]): Promise<Record<string, PresenceStatus>> {
  if (userIds.length === 0) return {};

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, lastSeenAt: true, presenceStatus: true },
  });

  return users.reduce((acc, user) => {
    acc[user.id] = resolvePresence(user.lastSeenAt, user.presenceStatus);
    return acc;
  }, {} as Record<string, PresenceStatus>);
}
