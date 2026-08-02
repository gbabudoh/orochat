'use client';

import { Cookie } from 'lucide-react';
import { useCookieConsent } from '@/components/consent/CookieConsentProvider';

/**
 * Persistent, always-reachable way to reopen cookie preferences after the
 * initial banner is gone — required so consent can be withdrawn/changed at
 * any time, not just decided once. Hidden until a decision has been made
 * (the banner itself is the entry point before that).
 */
export default function CookieSettingsButton() {
  const { consent, isHydrated, openPreferences } = useCookieConsent();

  if (!isHydrated || consent === null) return null;

  return (
    <button
      type="button"
      onClick={openPreferences}
      aria-label="Cookie settings"
      title="Cookie settings"
      className="fixed bottom-20 lg:bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200/80 flex items-center justify-center text-[#458B9E] hover:bg-[#458B9E]/5 transition-colors"
    >
      <Cookie className="w-4.5 h-4.5" />
    </button>
  );
}
