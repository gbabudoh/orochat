import { db } from '@/lib/db';
import { cosineSimilarity } from '@/lib/ai/embeddings';

export type AdPlacementContext = { surface: 'GLOBAL' } | { surface: 'COMPASS'; compassId: string };

export interface SponsoredAd {
  id: string;
  advertiserName: string;
  headline: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string;
  ctaUrl: string;
}

const AD_SELECT = {
  id: true,
  advertiserName: true,
  headline: true,
  body: true,
  imageUrl: true,
  ctaLabel: true,
  ctaUrl: true,
} as const;

// Below this, a topic "match" between a campaign's keywords and a community
// is just noise — same threshold Explore search uses for the same reason.
const MIN_RELEVANCE = 0.4;

function pickRandom(candidates: SponsoredAd[]): SponsoredAd | null {
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Picks one eligible ACTIVE campaign for a feed placement.
 *
 * GLOBAL surfaces require targetGlobal.
 *
 * COMPASS surfaces are eligible two ways: (1) manually targeted — the
 * community's id is explicitly in targetCompassIds, always eligible, admin's
 * call overrides relevance scoring; or (2) untargeted (targetCompassIds is
 * empty) — eligible everywhere if the campaign has no targetKeywords set
 * (legacy default), otherwise gated by cosine similarity between the
 * campaign's targetEmbedding and the community's embedding.
 *
 * Random pick among ties — no pacing/frequency-capping in this v1.
 */
export async function selectAd(context: AdPlacementContext): Promise<SponsoredAd | null> {
  const now = new Date();
  const dateStatusFilter = { status: 'ACTIVE' as const, startAt: { lte: now }, endAt: { gte: now } };

  if (context.surface === 'GLOBAL') {
    const candidates = await db.adCampaign.findMany({
      where: { ...dateStatusFilter, targetGlobal: true },
      select: AD_SELECT,
    });
    return pickRandom(candidates);
  }

  const [manuallyTargeted, untargeted, compass] = await Promise.all([
    db.adCampaign.findMany({
      where: { ...dateStatusFilter, targetCompassIds: { has: context.compassId } },
      select: AD_SELECT,
    }),
    db.adCampaign.findMany({
      where: { ...dateStatusFilter, targetCompassIds: { isEmpty: true } },
      select: { ...AD_SELECT, targetEmbedding: true },
    }),
    db.compass.findUnique({ where: { id: context.compassId }, select: { embedding: true } }),
  ]);

  const relevanceEligible: SponsoredAd[] = untargeted
    .filter((c) => {
      if (c.targetEmbedding.length === 0) return true;
      if (!compass?.embedding || compass.embedding.length === 0) return false;
      return cosineSimilarity(c.targetEmbedding, compass.embedding) >= MIN_RELEVANCE;
    })
    .map((c) => ({
      id: c.id,
      advertiserName: c.advertiserName,
      headline: c.headline,
      body: c.body,
      imageUrl: c.imageUrl,
      ctaLabel: c.ctaLabel,
      ctaUrl: c.ctaUrl,
    }));

  return pickRandom([...manuallyTargeted, ...relevanceEligible]);
}
