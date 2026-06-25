import geoip from 'geoip-lite';
import { headers } from 'next/headers';

// Resolves the requesting visitor's IP to an ISO 3166-1 alpha-2 country code
// using the local geoip-lite database (no external API calls). Reverse-proxied
// VPS deployments must forward the real client IP via X-Forwarded-For.
export async function getRequestCountryCode(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || h.get('x-real-ip');

  if (!ip) return null;

  const lookup = geoip.lookup(ip);
  return lookup?.country ?? null;
}
