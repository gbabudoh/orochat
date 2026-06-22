import { db } from '@/lib/db';
import { AdCampaignStatus } from '@prisma/client';
import { embedText } from '@/lib/ai/embeddings';

export interface AdCampaignInput {
  advertiserName: string;
  headline: string;
  body: string;
  imageUrl?: string | null;
  ctaLabel: string;
  ctaUrl: string;
  startAt: Date;
  endAt: Date;
  targetGlobal: boolean;
  targetCompassIds: string[];
  targetKeywords?: string | null;
}

async function withTargetEmbedding(data: AdCampaignInput) {
  const targetKeywords = data.targetKeywords?.trim() || null;
  const targetEmbedding = targetKeywords ? await embedText(targetKeywords) : [];
  return { ...data, targetKeywords, targetEmbedding };
}

export class AdCampaignService {
  static async createCampaign(data: AdCampaignInput) {
    return db.adCampaign.create({ data: await withTargetEmbedding(data) });
  }

  static async updateCampaign(id: string, data: AdCampaignInput) {
    return db.adCampaign.update({ where: { id }, data: await withTargetEmbedding(data) });
  }

  static async setCampaignStatus(id: string, status: AdCampaignStatus) {
    return db.adCampaign.update({ where: { id }, data: { status } });
  }

  static async bulkSetCampaignStatus(ids: string[], status: AdCampaignStatus) {
    if (ids.length === 0) return;
    return db.adCampaign.updateMany({ where: { id: { in: ids } }, data: { status } });
  }

  static async listCampaigns(options: {
    q?: string;
    status?: AdCampaignStatus;
    sort?: 'createdAt' | 'impressions' | 'clicks';
    dir?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  } = {}) {
    const { q, status, sort = 'createdAt', dir = 'desc', skip, take } = options;

    const where = {
      ...(status ? { status } : {}),
      ...(q
        ? { OR: [{ advertiserName: { contains: q, mode: 'insensitive' as const } }, { headline: { contains: q, mode: 'insensitive' as const } }] }
        : {}),
    };

    const orderBy =
      sort === 'impressions'
        ? { impressions: { _count: dir } }
        : sort === 'clicks'
          ? { clicks: { _count: dir } }
          : { createdAt: dir };

    const [campaigns, total] = await Promise.all([
      db.adCampaign.findMany({
        where,
        orderBy,
        include: { _count: { select: { impressions: true, clicks: true } } },
        skip,
        take,
      }),
      db.adCampaign.count({ where }),
    ]);

    return {
      campaigns: campaigns.map((c) => ({
        ...c,
        impressionCount: c._count.impressions,
        clickCount: c._count.clicks,
      })),
      total,
    };
  }

  static async getCampaign(id: string) {
    return db.adCampaign.findUnique({ where: { id } });
  }

  static async getCampaignStats(id: string) {
    const [impressionCount, clickCount] = await Promise.all([
      db.adImpression.count({ where: { campaignId: id } }),
      db.adClick.count({ where: { campaignId: id } }),
    ]);
    const ctr = impressionCount > 0 ? clickCount / impressionCount : 0;
    return { impressionCount, clickCount, ctr };
  }
}
