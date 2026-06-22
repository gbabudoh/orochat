'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { HEARTBEAT_INTERVAL_MS } from '@/lib/presence';

function sendOfflineBeacon() {
  // sendBeacon survives page unload, unlike a regular fetch — best-effort
  // attempt to mark offline immediately when a tab closes (the staleness
  // fallback in resolvePresence() still covers crashes/lost beacons).
  navigator.sendBeacon('/api/presence/heartbeat', JSON.stringify({ status: 'offline' }));
}

export default function PresenceHeartbeat() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const sendHeartbeat = () => {
      fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'online' }),
        keepalive: true,
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    window.addEventListener('pagehide', sendOfflineBeacon);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', sendOfflineBeacon);
    };
  }, [session?.user?.id]);

  return null;
}
