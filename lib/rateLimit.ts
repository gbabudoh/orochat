import { db } from '@/lib/db';

// Generic rolling-window rate limiter backed by RateLimitEvent — no
// Redis/KV in this stack, and none needed at this app's scale. Counts
// events for `key` within the trailing `windowMs`, records this call as a
// new event when allowed, and opportunistically garbage-collects rows for
// this key that have aged out of the window.
export async function checkRateLimit(
  key: string,
  windowMs: number,
  max: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowMs);
  const count = await db.rateLimitEvent.count({ where: { key, createdAt: { gt: windowStart } } });

  if (count >= max) {
    return { allowed: false, remaining: 0 };
  }

  await db.rateLimitEvent.create({ data: { key } });
  db.rateLimitEvent.deleteMany({ where: { key, createdAt: { lte: windowStart } } }).catch(() => {});

  return { allowed: true, remaining: max - count - 1 };
}
