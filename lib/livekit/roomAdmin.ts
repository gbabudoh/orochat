import { RoomServiceClient } from 'livekit-server-sdk';

function getAdminHost(): string {
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!wsUrl) throw new Error('NEXT_PUBLIC_LIVEKIT_URL is not configured');
  return wsUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
}

let client: RoomServiceClient | null = null;

function getRoomServiceClient(): RoomServiceClient {
  if (client) return client;

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error('LiveKit server credentials are not configured');

  client = new RoomServiceClient(getAdminHost(), apiKey, apiSecret);
  return client;
}

/**
 * Force-ends a LiveKit room, disconnecting every connected participant.
 * Used to enforce a call's duration limit and for moderator "End Call for Everyone".
 */
export async function deleteRoom(roomName: string): Promise<void> {
  try {
    await getRoomServiceClient().deleteRoom(roomName);
  } catch (error) {
    // Room may have already ended (everyone left) — deleting it is then a no-op.
    console.error(`Failed to delete LiveKit room ${roomName}:`, error);
  }
}
