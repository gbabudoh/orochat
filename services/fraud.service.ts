import { db } from '@/lib/db';

// Networks this small naturally look "dense" by chance, so skip the clique
// check below this size to avoid flagging ordinary small friend groups.
const MIN_OROS_FOR_CLIQUE_CHECK = 4;
// Fraction of a partner's Oros that are also mutually connected to each
// other. Organic professional networks rarely exceed this; sybil rings
// (everyone connects to everyone in a small farmed cluster) do.
const CLIQUE_RISK_THRESHOLD = 0.6;

const BURST_WINDOW_HOURS = 24;
const BURST_CONNECTION_THRESHOLD = 10; // accepted connections within the window

const RISK_FLAG_THRESHOLD = 0.5;

export interface FraudSignal {
  type: 'dense-clique' | 'connection-burst';
  value: number;
  detail: string;
}

export class FraudService {
  /**
   * Local clustering coefficient of a user's Oro network: the fraction of
   * possible edges among their Oros that actually exist. A near-complete
   * subgraph is the signature of a farmed/sybil connection ring rather than
   * an organic professional network.
   */
  static async getClusteringCoefficient(
    userId: string
  ): Promise<{ coefficient: number; oroCount: number }> {
    const connections = await db.connection.findMany({
      where: { status: 'ACCEPTED', OR: [{ senderId: userId }, { receiverId: userId }] },
      select: { senderId: true, receiverId: true },
    });
    const oroIds = connections.map((c) => (c.senderId === userId ? c.receiverId : c.senderId));

    if (oroIds.length < MIN_OROS_FOR_CLIQUE_CHECK) {
      return { coefficient: 0, oroCount: oroIds.length };
    }

    const internalEdges = await db.connection.count({
      where: { status: 'ACCEPTED', senderId: { in: oroIds }, receiverId: { in: oroIds } },
    });
    const maxPossibleEdges = (oroIds.length * (oroIds.length - 1)) / 2;
    const coefficient = maxPossibleEdges > 0 ? internalEdges / maxPossibleEdges : 0;

    return { coefficient, oroCount: oroIds.length };
  }

  /**
   * Largest number of this user's connections accepted within any rolling
   * window of BURST_WINDOW_HOURS. Scripted connection-farming tends to
   * accept many connections in a short burst; organic networking doesn't.
   */
  static async getMaxConnectionBurst(userId: string): Promise<number> {
    const connections = await db.connection.findMany({
      where: { status: 'ACCEPTED', OR: [{ senderId: userId }, { receiverId: userId }] },
      select: { verifiedAt: true },
      orderBy: { verifiedAt: 'asc' },
    });
    const timestamps = connections
      .map((c) => c.verifiedAt?.getTime())
      .filter((t): t is number => typeof t === 'number');

    const windowMs = BURST_WINDOW_HOURS * 60 * 60 * 1000;
    let maxBurst = 0;
    let windowStart = 0;
    for (let i = 0; i < timestamps.length; i++) {
      while (timestamps[i] - timestamps[windowStart] > windowMs) {
        windowStart++;
      }
      maxBurst = Math.max(maxBurst, i - windowStart + 1);
    }
    return maxBurst;
  }

  static async getRiskScore(userId: string): Promise<{ riskScore: number; signals: FraudSignal[] }> {
    const [{ coefficient, oroCount }, maxBurst] = await Promise.all([
      this.getClusteringCoefficient(userId),
      this.getMaxConnectionBurst(userId),
    ]);

    const signals: FraudSignal[] = [];
    let riskScore = 0;

    if (oroCount >= MIN_OROS_FOR_CLIQUE_CHECK && coefficient >= CLIQUE_RISK_THRESHOLD) {
      signals.push({
        type: 'dense-clique',
        value: coefficient,
        detail: `${Math.round(coefficient * 100)}% of this user's ${oroCount} Oros are mutually connected to each other`,
      });
      riskScore += coefficient;
    }

    if (maxBurst >= BURST_CONNECTION_THRESHOLD) {
      signals.push({
        type: 'connection-burst',
        value: maxBurst,
        detail: `${maxBurst} connections accepted within a ${BURST_WINDOW_HOURS}h window`,
      });
      riskScore += Math.min(maxBurst / (BURST_CONNECTION_THRESHOLD * 2), 1);
    }

    return { riskScore: Math.min(riskScore, 1), signals };
  }

  /**
   * Scans every Orochat Partner (the only users eligible for revenue
   * payouts) and persists a FraudFlag for anyone above the risk threshold.
   * Intended to run immediately before AdminService.distributeRevenue.
   */
  static async scanPartnersForFraud(): Promise<string[]> {
    const partners = await db.user.findMany({ where: { isPartner: true }, select: { id: true } });
    const flaggedUserIds: string[] = [];

    for (const partner of partners) {
      const { riskScore, signals } = await this.getRiskScore(partner.id);
      if (riskScore >= RISK_FLAG_THRESHOLD) {
        await db.fraudFlag.create({
          data: {
            userId: partner.id,
            riskScore,
            reason: signals.map((s) => s.detail).join('; '),
          },
        });
        flaggedUserIds.push(partner.id);
      }
    }

    return flaggedUserIds;
  }

  static async getUnresolvedFlags() {
    return db.fraudFlag.findMany({
      where: { resolved: false },
      include: { user: { select: { id: true, name: true, email: true, isPartner: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
