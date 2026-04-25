import { db } from '@/lib/db';
import { TESService } from './tes.service';

/**
 * Admin Service
 * Handles revenue distribution and ad revenue pool management
 */
export class AdminService {
  /**
   * Create a new ad revenue pool for a month
   */
  static async createRevenuePool(month: number, year: number, amount: number) {
    return await db.adRevenuePool.create({
      data: {
        month,
        year,
        totalAmount: amount,
      },
    });
  }

  /**
   * Distribute revenue to qualified partners based on TES
   */
  static async distributeRevenue(poolId: string): Promise<void> {
    const pool = await db.adRevenuePool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new Error('Revenue pool not found');
    }

    if (pool.distributed) {
      throw new Error('Revenue already distributed');
    }

    // Get TES distribution
    const tesDistribution = await TESService.getTESDistribution();
    const totalTES = await TESService.getTotalPartnerTES();

    if (totalTES === 0) {
      throw new Error('No TES to distribute');
    }

    // Create distribution records
    const distributions = tesDistribution.map((dist) => ({
      poolId,
      userId: dist.userId,
      tesShare: dist.share,
      amount: pool.totalAmount * dist.share,
    }));

    await db.revenueDistribution.createMany({
      data: distributions,
    });

    // Mark pool as distributed
    await db.adRevenuePool.update({
      where: { id: poolId },
      data: {
        distributed: true,
        distributedAt: new Date(),
      },
    });
  }

  /**
   * Mark a distribution as paid
   */
  static async markDistributionPaid(distributionId: string): Promise<void> {
    await db.revenueDistribution.update({
      where: { id: distributionId },
      data: {
        paid: true,
        paidAt: new Date(),
      },
    });
  }

  /**
   * Get user's revenue distributions
   */
  static async getUserDistributions(userId: string) {
    return await db.revenueDistribution.findMany({
      where: { userId },
      include: {
        pool: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get current month's revenue pool
   */
  static async getCurrentRevenuePool() {
    const now = new Date();
    return await db.adRevenuePool.findUnique({
      where: {
        month_year: {
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
      include: {
        distributions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }
}

