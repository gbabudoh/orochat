'use server';

import { ConnectionService } from '@/services/connection.service';
import { db } from '@/lib/db';
import { triggerNotification } from '@/lib/novu';

export async function sendConnectionRequest(senderId: string, receiverId: string) {
  try {
    await ConnectionService.sendConnectionRequest(senderId, receiverId);
    
    // Get sender info for notification
    const sender = await db.user.findUnique({ where: { id: senderId } });
    
    await triggerNotification('connection-request', receiverId, {
      message: `${sender?.name || 'Someone'} sent you a connection request`,
      senderName: sender?.name || 'Someone',
      type: 'connection_request'
    }, senderId);

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to send connection request' };
  }
}

export async function acceptConnection(connectionId: string, userId: string) {
  try {
    await ConnectionService.acceptConnection(connectionId, userId);
    
    // Get connection info to notify the other party
    const connection = await db.connection.findUnique({
      where: { id: connectionId },
      include: { sender: true, receiver: true }
    });

    if (connection) {
      const otherUserId = connection.senderId === userId ? connection.receiverId : connection.senderId;
      const currentUser = connection.senderId === userId ? connection.sender : connection.receiver;

      await triggerNotification('connection-accepted', otherUserId, {
        message: `${currentUser?.name || 'Someone'} accepted your connection request`,
        userName: currentUser?.name || 'Someone',
        type: 'connection_accepted'
      }, userId);
    }

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to accept connection' };
  }
}

export async function rejectConnection(connectionId: string, userId: string) {
  try {
    await ConnectionService.rejectConnection(connectionId, userId);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to reject connection' };
  }
}

export async function getUserConnections(userId: string) {
  try {
    const connections = await ConnectionService.getUserConnections(userId);
    return { success: true, connections };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to fetch connections' };
  }
}

export async function getPendingRequests(userId: string) {
  try {
    const requests = await ConnectionService.getPendingRequests(userId);
    return { success: true, requests };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to fetch pending requests' };
  }
}

export async function searchUsers(query: string, currentUserId: string) {
  try {
    const users = await db.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { title: { contains: query, mode: 'insensitive' } },
              { company: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        title: true,
        company: true,
        location: true,
        isPartner: true,
        verifiedOrosCount: true,
      },
      take: 20,
    });

    return { success: true, users };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to search users' };
  }
}

