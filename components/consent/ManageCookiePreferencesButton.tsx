'use client';

import { Cookie } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCookieConsent } from '@/components/consent/CookieConsentProvider';

export default function ManageCookiePreferencesButton() {
  const { openPreferences } = useCookieConsent();

  return (
    <Button variant="secondary" onClick={openPreferences} className="gap-1.5">
      <Cookie className="w-4 h-4" />
      Manage Cookie Preferences
    </Button>
  );
}
