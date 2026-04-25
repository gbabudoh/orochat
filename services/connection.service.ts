import { db } from '@/lib/db';
import { TESService } from './tes.service';

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
}

