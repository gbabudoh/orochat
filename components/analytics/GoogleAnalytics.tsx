'use client';

import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google';
import { useCookieConsent } from '@/components/consent/CookieConsentProvider';

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const { consent } = useCookieConsent();

  // Never mounted until analytics consent is explicitly granted — GA's
  // script/cookies never load beforehand.
  if (!gaId || !consent?.analytics) return null;
  return <NextGoogleAnalytics gaId={gaId} />;
}
