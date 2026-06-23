import { db } from '@/lib/db';
import { TESService } from './tes.service';
import { FraudService } from './fraud.service';
import { StripeService } from './stripe.service';
import { getPlatformConfig } from '@/lib/platformConfig';

/**
 * Admin Service
 * Handles revenue distribution and ad revenue pool management
 */
export class AdminService {
  /**
   * Create a new ad revenue pool for a month. `grossAmount` is the total ad
   * revenue collected that period; it's split by the platform's configured
   * oroSharePercent into the Oro-payable pool (totalAmount, used unchanged
   * by distributeRevenue below) and the retained platform cut.
   */
  static async createRevenuePool(month: number, year: number, grossAmount: number) {
    const { oroSharePercent } = await getPlatformConfig();
    const totalAmount = grossAmount * oroSharePercent;
    const platformCutAmount = grossAmount - totalAmount;

    return await db.adRevenuePool.create({
      data: {
        month,
        year,
        grossAmount,
        totalAmount,
        platformCutAmount,
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

    // Flag sybil-like connection rings / connection-farming bursts before
    // money moves, and exclude flagged partners from this round's payout —
    // their share is redistributed across the remaining legitimate partners.
    const flaggedUserIds = new Set(await FraudService.scanPartnersForFraud());

    const tesDistribution = (await TESService.getTESDistribution()).filter(
      (dist) => !flaggedUserIds.has(dist.userId)
    );
    const totalTES = tesDistribution.reduce((sum, dist) => sum + dist.tes, 0);

    if (totalTES === 0) {
      throw new Error('No TES to distribute');
    }

    // Create distribution records
    const distributions = tesDistribution.map((dist) => ({
      poolId,
      userId: dist.userId,
      tesShare: dist.tes / totalTES,
      amount: pool.totalAmount * (dist.tes / totalTES),
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

    // Move real money: attempt a Stripe transfer to every eligible,
    // payout-connected Oro in this pool.
    await StripeService.payoutEligibleDistributions(poolId);
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
   * List all revenue pools, most recent first (for the admin dashboard)
   */
  static async getAllRevenuePools() {
    return await db.adRevenuePool.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  /**
   * Get a single pool with its distributions (for the admin drill-in view)
   */
  static async getRevenuePool(poolId: string) {
    return await db.adRevenuePool.findUnique({
      where: { id: poolId },
      include: {
        distributions: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { amount: 'desc' },
        },
      },
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

