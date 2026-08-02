'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useCookieConsent } from '@/components/consent/CookieConsentProvider';

function ToggleRow({
  title,
  description,
  checked,
  locked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#333333] mb-1">
          {title}
          {locked && <span className="ml-2 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Always on</span>}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={locked}
        onClick={() => onChange?.(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-[#458B9E]' : 'bg-gray-300'
        } ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}

export default function CookiePreferencesModal() {
  const { consent, isPreferencesOpen, closePreferences, rejectAll, savePreferences } = useCookieConsent();
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);

  // Re-sync the local toggle whenever the panel transitions to open, so it
  // reflects the current saved choice rather than a stale value from a
  // previous open-then-cancel. Resetting during render (keyed off the last
  // open state) avoids an extra render pass versus doing this in an effect.
  const [wasOpen, setWasOpen] = useState(isPreferencesOpen);
  if (isPreferencesOpen !== wasOpen) {
    setWasOpen(isPreferencesOpen);
    if (isPreferencesOpen) setAnalytics(consent?.analytics ?? false);
  }

  return (
    <Modal isOpen={isPreferencesOpen} onClose={closePreferences} title="Manage Cookie Preferences" size="md">
      <p className="text-sm text-gray-500 mb-2 leading-relaxed">
        Choose which cookies Orochat can use. You can change this anytime from the cookie icon in the
        corner of the screen.
      </p>

      <div className="mt-2">
        <ToggleRow
          title="Strictly Necessary"
          description="Required for login, security, and core site functionality. These can't be switched off."
          checked
          locked
        />
        <ToggleRow
          title="Analytics"
          description="Google Analytics, Microsoft Clarity, and Matomo — helps us understand how Orochat is used so we can improve it. No analytics cookies are set unless this is on."
          checked={analytics}
          onChange={setAnalytics}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2.5 mt-6">
        <Button variant="secondary" onClick={rejectAll} className="w-full sm:w-auto">
          Reject All
        </Button>
        <Button variant="primary" onClick={() => savePreferences(analytics)} className="w-full sm:w-auto">
          Save Preferences
        </Button>
      </div>
    </Modal>
  );
}
