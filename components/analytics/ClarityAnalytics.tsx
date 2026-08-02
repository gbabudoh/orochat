'use client';

import { useEffect, useRef } from 'react';
import Clarity from '@microsoft/clarity';
import { useCookieConsent } from '@/components/consent/CookieConsentProvider';

export default function ClarityAnalytics() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const { consent } = useCookieConsent();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!projectId) return;

    if (consent?.analytics) {
      // Only ever initialized once analytics consent is granted — Clarity's
      // script/cookies never load beforehand.
      if (!hasInitialized.current) {
        Clarity.init(projectId);
        hasInitialized.current = true;
      }
      Clarity.consent(true);
    } else if (hasInitialized.current) {
      // Best-effort signal if consent is later withdrawn after being granted.
      // Clarity has no "unload" API — a full stop requires a page reload,
      // a limitation shared by any script-injection-based analytics tool.
      Clarity.consent(false);
    }
  }, [projectId, consent?.analytics]);

  return null;
}
