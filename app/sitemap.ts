import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/explore`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/signup`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/legal/privacy`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${SITE_URL}/legal/terms`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  // Public profiles (app/oro/[id]/page.tsx is unauthenticated-accessible).
  // Paused accounts are excluded since their profile page isn't meaningful
  // to surface in search results.
  const users = await db.user.findMany({
    where: { isPaused: false },
    select: { id: true, updatedAt: true },
  });

  const profilePages: MetadataRoute.Sitemap = users.map((user) => ({
    url: `${SITE_URL}/oro/${user.id}`,
    lastModified: user.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticPages, ...profilePages];
}
