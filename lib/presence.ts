export type PresenceStatus = 'online' | 'offline';

// How often the client sends a heartbeat
export const HEARTBEAT_INTERVAL_MS = 20_000;

// Beyond this with no heartbeat at all, treat as offline regardless of the
// last status the client reported (covers closed tabs/crashed sessions that
// never got to send an explicit "offline" beacon on logout)
const STALE_AFTER_MS = 45_000;

export function resolvePresence(lastSeenAt: Date | string | null, storedStatus: string | null): PresenceStatus {
  if (storedStatus === 'offline') return 'offline';
  if (!lastSeenAt) return 'offline';
  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  if (elapsed > STALE_AFTER_MS) return 'offline';
  return 'online';
}
