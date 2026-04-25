import { db } from '@/lib/db';

/**
 * TES (Total Engagement Score) Service
 * Calculates and manages user engagement scores based on:
 * - Usage of Collab by their Oros
 * - Activity of their Oros on Feed
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

    // Calculate Collab usage score (messages sent/received by Oros)
    const collabScore = await db.message.count({
      where: {
        OR: [
          { senderId: { in: oroIds } },
          { receiverId: { in: oroIds } },
        ],
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    // Calculate Feed activity score (posts by Oros)
    const feedScore = await db.feedPost.count({
      where: {
        authorId: { in: oroIds },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

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

