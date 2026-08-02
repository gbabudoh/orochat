'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCookieConsent } from '@/components/consent/CookieConsentProvider';

export default function CookieBanner() {
  const { consent, isHydrated, acceptAll, rejectAll, openPreferences } = useCookieConsent();

  const shouldShow = isHydrated && consent === null;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-100 p-3 sm:p-4"
        >
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200/80 p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#458B9E]/10 flex items-center justify-center shrink-0">
                <Cookie className="w-4.5 h-4.5 text-[#458B9E]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#333333] mb-1">We value your privacy</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We use strictly necessary cookies to run Orochat, and — only with your permission —
                  analytics cookies (Google Analytics, Microsoft Clarity, Matomo) to understand how the
                  product is used. No analytics cookies are set until you accept them. Read our{' '}
                  <Link href="/legal/cookies" className="text-[#458B9E] font-medium hover:underline">
                    Cookie Policy
                  </Link>{' '}
                  for details.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5">
              <button
                type="button"
                onClick={openPreferences}
                className="text-sm font-semibold text-gray-500 hover:text-[#458B9E] transition-colors px-2 py-2 sm:mr-auto text-left sm:text-center"
              >
                Manage Preferences
              </button>
              {/* Reject and Accept are deliberately the same size/variant weight class — neither is
                  visually favored, per GDPR/PECR guidance on equal prominence. */}
              <Button variant="secondary" size="md" onClick={rejectAll} className="w-full sm:w-auto">
                Reject All
              </Button>
              <Button variant="primary" size="md" onClick={acceptAll} className="w-full sm:w-auto">
                Accept All
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
