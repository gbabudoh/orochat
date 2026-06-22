import type { SponsoredAd } from '@/lib/ads/selectAd';

export type FeedEntry<T> = { kind: 'post'; post: T } | { kind: 'ad'; ad: SponsoredAd };

/**
 * Inserts `ad` after every `interval`th post, counting cumulatively across
 * pages via `startOffset` (the number of posts already rendered before this
 * batch) — so cadence stays consistent across cursor/offset pagination
 * instead of resetting to 0 on every page fetch.
 */
export function interleaveSponsored<T>(
  posts: T[],
  ad: SponsoredAd | null,
  interval: number,
  startOffset: number
): FeedEntry<T>[] {
  if (!ad) return posts.map((post) => ({ kind: 'post', post }));

  const entries: FeedEntry<T>[] = [];
  posts.forEach((post, idx) => {
    entries.push({ kind: 'post', post });
    const globalPosition = startOffset + idx + 1;
    if (globalPosition % interval === 0) {
      entries.push({ kind: 'ad', ad });
    }
  });
  return entries;
}

export const AD_INTERVAL = 8;
