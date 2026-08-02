// Cookie consent — storage layer only (no React here, see components/consent/).
//
// Bump CONSENT_POLICY_VERSION whenever the cookie policy or the set of
// trackers materially changes (e.g. a new analytics tool is added). Any
// cookie written under an older version is treated as "no decision yet" and
// the banner reappears, satisfying the "consent must be re-obtained when
// processing changes" requirement.

export const CONSENT_COOKIE_NAME = 'orochat_cookie_consent';
export const CONSENT_POLICY_VERSION = 1;
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export interface CookieConsent {
  necessary: true; // not a real choice — always on, shown for transparency only
  analytics: boolean;
  version: number;
  decidedAt: string;
}

export function readConsentCookie(): CookieConsent | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)`));
  if (!match) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as CookieConsent;
    if (parsed.version !== CONSENT_POLICY_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsentCookie(consent: CookieConsent): void {
  if (typeof document === 'undefined') return;
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secureFlag}`;
}
