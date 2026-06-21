import { db } from '@/lib/db';
import { TESService } from './tes.service';
import { cosineSimilarity } from '@/lib/ai/embeddings';

/**
 * Connection Service
 * Handles Oros (verified professional connections) logic
 * Manages qualification threshold: 1,000 Verified Oros OR 10 Compass Communities
 */
export class ConnectionService {
  /**
   * Send a connection request
   */
  static async sendConnectionRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new Error('Cannot connect to yourself');
    }

    // Check if connection already exists
    const existing = await db.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      throw new Error('Connection already exists');
    }

    return await db.connection.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Accept a connection request
   */
  static async acceptConnection(connectionId: string, userId: string) {
    const connection = await db.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.receiverId !== userId) {
      throw new Error('Unauthorized');
    }

    if (connection.status !== 'PENDING') {
      throw new Error('Connection already processed');
    }

    const updated = await db.connection.update({
      where: { id: connectionId },
      data: {
        status: 'ACCEPTED',
        verifiedAt: new Date(),
      },
    });

    // Update verified Oros counts for both users
    await this.updateVerifiedOrosCount(connection.senderId);
    await this.updateVerifiedOrosCount(connection.receiverId);

    // Check qualification for both users
    await this.checkQualification(connection.senderId);
    await this.checkQualification(connection.receiverId);

    return updated;
  }

  /**
   * Reject a connection request
   */
  static async rejectConnection(connectionId: string, userId: string) {
    const connection = await db.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection || connection.receiverId !== userId) {
      throw new Error('Unauthorized');
    }

    return await db.connection.update({
      where: { id: connectionId },
      data: { status: 'REJECTED' },
    });
  }

  /**
   * Get verified Oros count for a user
   */
  static async getVerifiedOrosCount(userId: string): Promise<number> {
    return await db.connection.count({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });
  }

  /**
   * Update cached verified Oros count
   */
  static async updateVerifiedOrosCount(userId: string): Promise<void> {
    const count = await this.getVerifiedOrosCount(userId);
    
    await db.user.update({
      where: { id: userId },
      data: { verifiedOrosCount: count },
    });
  }

  /**
   * Check if user qualifies for Orochat Partner status
   * Qualification: 1,000 Verified Oros OR 10 Compass Communities
   */
  static async checkQualification(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        compassMemberships: true,
      },
    });

    if (!user) {
      return false;
    }

    // Already a partner
    if (user.isPartner) {
      return true;
    }

    // Check qualification threshold
    const has1000Oros = user.verifiedOrosCount >= 1000;
    const has10Compass = user.compassMembershipsCount >= 10;

    if (has1000Oros || has10Compass) {
      // Grant partner status
      await db.user.update({
        where: { id: userId },
        data: {
          isPartner: true,
          qualifiedAt: new Date(),
        },
      });

      return true;
    }

    return false;
  }

  /**
   * Get user's connections (Oros)
   */
  static async getUserConnections(userId: string) {
    const connections = await db.connection.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
      },
    });

    return connections.map((conn) => ({
      ...conn,
      oro: conn.senderId === userId ? conn.receiver : conn.sender,
    }));
  }

  /**
   * Get pending connection requests for a user
   */
  static async getPendingRequests(userId: string) {
    return await db.connection.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
      },
    });
  }

  /**
   * "People You May Know" — ranks candidates by mutual connections
   * (friends-of-friends), shared Compass memberships, and professional
   * profile similarity (cosine similarity over the same embedding used for
   * semantic search), the way LinkedIn's PYMK works, instead of raw
   * verifiedOrosCount popularity. Falls back to popularity to fill
   * remaining slots for users with a sparse graph.
   */
  static async getSuggestedOros(userId: string, limit = 3) {
    const myConnections = await db.connection.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      select: { senderId: true, receiverId: true, status: true },
    });

    const otherSide = (c: { senderId: string; receiverId: string }) =>
      c.senderId === userId ? c.receiverId : c.senderId;

    const excludeIds = new Set([userId, ...myConnections.map(otherSide)]);
    const acceptedOroIds = myConnections.filter((c) => c.status === 'ACCEPTED').map(otherSide);

    // Friends-of-friends: who my accepted Oros are connected to
    const fofConnections = acceptedOroIds.length
      ? await db.connection.findMany({
          where: {
            status: 'ACCEPTED',
            OR: [{ senderId: { in: acceptedOroIds } }, { receiverId: { in: acceptedOroIds } }],
          },
          select: { senderId: true, receiverId: true },
        })
      : [];

    const mutualCounts = new Map<string, number>();
    for (const conn of fofConnections) {
      for (const id of [conn.senderId, conn.receiverId]) {
        if (excludeIds.has(id)) continue;
        mutualCounts.set(id, (mutualCounts.get(id) ?? 0) + 1);
      }
    }

    // Shared Compass community memberships
    const myCompassIds = (
      await db.compassMembership.findMany({ where: { userId }, select: { compassId: true } })
    ).map((m) => m.compassId);

    const sharedCompassMembers = myCompassIds.length
      ? await db.compassMembership.findMany({
          where: { compassId: { in: myCompassIds }, userId: { notIn: Array.from(excludeIds) } },
          select: { userId: true },
        })
      : [];

    const compassCounts = new Map<string, number>();
    for (const m of sharedCompassMembers) {
      compassCounts.set(m.userId, (compassCounts.get(m.userId) ?? 0) + 1);
    }

    // Professional profile similarity: same embedding used for semantic search,
    // lets a same-field/industry match surface even with zero network overlap.
    const semanticScores = new Map<string, number>();
    const me = await db.user.findUnique({ where: { id: userId }, select: { embedding: true } });
    if (me?.embedding && me.embedding.length > 0) {
      const candidatePool = await db.user.findMany({
        where: { id: { notIn: Array.from(excludeIds) }, isPaused: false, embedding: { isEmpty: false } },
        orderBy: { updatedAt: 'desc' },
        take: 300,
        select: { id: true, embedding: true },
      });
      for (const candidate of candidatePool) {
        semanticScores.set(candidate.id, cosineSimilarity(me.embedding, candidate.embedding));
      }
    }

    const candidateIds = new Set([...mutualCounts.keys(), ...compassCounts.keys(), ...semanticScores.keys()]);
    const ranked = Array.from(candidateIds)
      .map((id) => ({
        id,
        score: (mutualCounts.get(id) ?? 0) * 3 + (compassCounts.get(id) ?? 0) * 2 + (semanticScores.get(id) ?? 0) * 2,
      }))
      .sort((a, b) => b.score - a.score);

    let topIds = ranked.slice(0, limit).map((r) => r.id);

    // Cold start (no mutual connections/communities yet): pad with popular profiles
    if (topIds.length < limit) {
      const fallback = await db.user.findMany({
        where: { id: { notIn: [...excludeIds, ...topIds] }, isPaused: false },
        orderBy: { verifiedOrosCount: 'desc' },
        take: limit - topIds.length,
        select: { id: true },
      });
      topIds = [...topIds, ...fallback.map((u) => u.id)];
    }

    if (topIds.length === 0) return [];

    const users = await db.user.findMany({
      where: { id: { in: topIds }, isPaused: false },
      select: { id: true, name: true, avatar: true, title: true, company: true, countryCode: true },
    });

    const orderIndex = new Map(topIds.map((id, idx) => [id, idx]));
    return users.sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));
  }
}

