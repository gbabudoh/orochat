'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CONSENT_POLICY_VERSION, type CookieConsent, readConsentCookie, writeConsentCookie } from '@/lib/consent';

interface CookieConsentContextValue {
  /** null = no decision recorded yet (or the policy changed since the last one) */
  consent: CookieConsent | null;
  /** false until the client has checked for an existing cookie, to avoid a hydration flash */
  isHydrated: boolean;
  isPreferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (analytics: boolean) => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    // Reading document.cookie is synchronizing with a browser-only external
    // system on mount — the textbook valid useEffect case, not the
    // derived-state antipattern this lint rule otherwise guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(readConsentCookie());
    setIsHydrated(true);
  }, []);

  const persist = useCallback((analytics: boolean) => {
    const next: CookieConsent = {
      necessary: true,
      analytics,
      version: CONSENT_POLICY_VERSION,
      decidedAt: new Date().toISOString(),
    };
    writeConsentCookie(next);
    setConsent(next);
    setIsPreferencesOpen(false);
  }, []);

  const value: CookieConsentContextValue = {
    consent,
    isHydrated,
    isPreferencesOpen,
    openPreferences: () => setIsPreferencesOpen(true),
    closePreferences: () => setIsPreferencesOpen(false),
    acceptAll: () => persist(true),
    rejectAll: () => persist(false),
    savePreferences: persist,
  };

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}
