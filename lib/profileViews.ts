import { db } from '@/lib/db';
import { getRequestCountryCode } from '@/lib/geoip';

export interface ProfileViewer {
  id: string | null;
  name: string | null;
  avatar: string | null;
  title: string | null;
  countryCode: string | null;
  viewedAt: Date;
}

export interface ProfileViewStats {
  totalCount: number;
  countryBreakdown: { countryCode: string; count: number }[];
  recentViewers: ProfileViewer[];
}

// Logs a profile view, skipping self-views. Country is resolved from the
// viewer's own profile if logged in, otherwise from their request IP.
export async function logProfileView(viewedId: string, viewerId: string | null) {
  if (viewerId === viewedId) return;

  let countryCode: string | null = null;
  if (viewerId) {
    const viewer = await db.user.findUnique({ where: { id: viewerId }, select: { countryCode: true } });
    countryCode = viewer?.countryCode ?? null;
  } else {
    countryCode = await getRequestCountryCode();
  }

  await db.profileView.create({
    data: { viewedId, viewerId, countryCode },
  });
}

export async function getProfileViewStats(viewedId: string): Promise<ProfileViewStats> {
  const [totalCount, countryGroups, recent] = await Promise.all([
    db.profileView.count({ where: { viewedId } }),
    db.profileView.groupBy({
      by: ['countryCode'],
      where: { viewedId, countryCode: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { countryCode: 'desc' } },
    }),
    db.profileView.findMany({
      where: { viewedId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        viewer: { select: { id: true, name: true, avatar: true, title: true, countryCode: true } },
      },
    }),
  ]);

  const countryBreakdown = countryGroups
    .filter((g) => g.countryCode)
    .map((g) => ({ countryCode: g.countryCode as string, count: g._count._all }));

  const recentViewers: ProfileViewer[] = recent.map((v) => ({
    id: v.viewer?.id ?? null,
    name: v.viewer?.name ?? 'Anonymous visitor',
    avatar: v.viewer?.avatar ?? null,
    title: v.viewer?.title ?? null,
    countryCode: v.viewer?.countryCode ?? v.countryCode,
    viewedAt: v.createdAt,
  }));

  return { totalCount, countryBreakdown, recentViewers };
}
