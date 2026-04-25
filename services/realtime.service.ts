import Pusher from 'pusher';
import PusherClient from 'pusher-js';

/**
 * Realtime Service
 * Handles WebSocket/real-time communication via Pusher
 * Powers instant messaging and real-time connection status
 */

// Server-side Pusher instance
let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      useTLS: true,
    });
  }
  return pusherServer;
}

// Client-side Pusher instance
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (typeof window === 'undefined') {
    throw new Error('Pusher client can only be used on the client side');
  }

  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    });
  }
  return pusherClient;
}

/**
 * Broadcast a new message to the chat channel
 */
export function broadcastMessage(channel: string, event: string, data: any) {
  const pusher = getPusherServer();
  pusher.trigger(channel, event, data);
}

/**
 * Get channel name for a chat between two users
 */
export function getChatChannel(userId1: string, userId2: string): string {
  const sortedIds = [userId1, userId2].sort();
  return `private-chat-${sortedIds[0]}-${sortedIds[1]}`;
}

/**
 * Subscribe to a chat channel (client-side)
 */
export function subscribeToChat(userId1: string, userId2: string, callback: (data: any) => void) {
  const pusher = getPusherClient();
  const channel = getChatChannel(userId1, userId2);
  
  const channelInstance = pusher.subscribe(channel);
  channelInstance.bind('new-message', callback);

  return () => {
    channelInstance.unbind('new-message', callback);
    pusher.unsubscribe(channel);
  };
}

