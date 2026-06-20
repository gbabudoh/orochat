import { db } from '@/lib/db';
import { decayedDailyActivityScore } from '@/lib/scoring/decay';

const LOOKBACK_DAYS = 30;
const HALF_LIFE_DAYS = 7; // an event a week old counts for half as much as one from today

/**
 * TES (Total Engagement Score) Service
 * Calculates and manages user engagement scores based on:
 * - Usage of Collab by their Oros
 * - Activity of their Oros on Feed
 *
 * Scoring is recency-decayed (HN-style half-life) and anti-spam-normalized
 * (at most one counted unit per Oro per calendar day) rather than a flat
 * count, so genuinely sustained engagement outranks someone flooding
 * messages/posts in a single sitting.
 */
export class TESService {
  /**
   * Calculate TES for a user based on their network's activity
   */
  static async calculateTES(userId: string): Promise<number> {
    // Get all verified connections (Oros) for this user
    const connections = await db.connection.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    const oroIds = connections.map((conn) =>
      conn.senderId === userId ? conn.receiverId : conn.senderId
    );

    if (oroIds.length === 0) {
      return 0;
    }

    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    // Collab usage: messages sent by an Oro in conversations they're part of
    const messages = await db.message.findMany({
      where: {
        senderId: { in: oroIds },
        conversation: { participants: { some: { userId: { in: oroIds } } } },
        createdAt: { gte: since },
      },
      select: { senderId: true, createdAt: true },
    });
    const collabScore = decayedDailyActivityScore(
      messages.map((m) => ({ actorId: m.senderId, createdAt: m.createdAt })),
      HALF_LIFE_DAYS
    );

    // Feed activity: posts by Oros
    const posts = await db.feedPost.findMany({
      where: {
        authorId: { in: oroIds },
        createdAt: { gte: since },
      },
      select: { authorId: true, createdAt: true },
    });
    const feedScore = decayedDailyActivityScore(
      posts.map((p) => ({ actorId: p.authorId, createdAt: p.createdAt })),
      HALF_LIFE_DAYS
    );

    // TES = Collab usage + Feed activity
    const tes = collabScore + feedScore;

    // Update user's TES
    await db.user.update({
      where: { id: userId },
      data: {
        currentTES: tes,
        lastTESUpdate: new Date(),
      },
    });

    // Log TES change
    await db.tESLog.create({
      data: {
        userId,
        tesValue: tes,
        changeReason: 'Monthly TES calculation',
      },
    });

    return tes;
  }

  /**
   * Update TES for a user (called when their Oros are active)
   */
  static async updateTES(userId: string, reason: string): Promise<void> {
    await this.calculateTES(userId);
  }

  /**
   * Get total TES for all partners (for revenue distribution)
   */
  static async getTotalPartnerTES(): Promise<number> {
    const partners = await db.user.findMany({
      where: { isPartner: true },
      select: { currentTES: true },
    });

    return partners.reduce((sum, partner) => sum + partner.currentTES, 0);
  }

  /**
   * Get TES distribution for revenue sharing
   */
  static async getTESDistribution(): Promise<Array<{ userId: string; tes: number; share: number }>> {
    const totalTES = await this.getTotalPartnerTES();
    
    if (totalTES === 0) {
      return [];
    }

    const partners = await db.user.findMany({
      where: { isPartner: true },
      select: { id: true, currentTES: true },
    });

    return partners.map((partner) => ({
      userId: partner.id,
      tes: partner.currentTES,
      share: partner.currentTES / totalTES,
    }));
  }
}

