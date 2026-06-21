'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

const MATOMO_URL = '//matomo.feendesk.com/';
const MATOMO_SITE_ID = '4';

declare global {
  interface Window {
    _paq?: unknown[][];
  }
}

/**
 * Tracks SPA route changes after the initial page load. The inline script
 * below already fires one trackPageView on load, so this only handles
 * client-side navigations within the App Router (which don't trigger a
 * fresh document load Matomo's snippet would otherwise rely on).
 */
function MatomoRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!window._paq) return;
    const url = `${window.location.origin}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    window._paq.push(['setCustomUrl', url]);
    window._paq.push(['setDocumentTitle', document.title]);
    window._paq.push(['trackPageView']);
  }, [pathname, searchParams]);

  return null;
}

export default function MatomoAnalytics() {
  return (
    <>
      <Script id="matomo-analytics" strategy="afterInteractive">
        {`
          var _paq = window._paq = window._paq || [];
          _paq.push(['trackPageView']);
          _paq.push(['enableLinkTracking']);
          (function() {
            var u="${MATOMO_URL}";
            _paq.push(['setTrackerUrl', u+'matomo.php']);
            _paq.push(['setSiteId', '${MATOMO_SITE_ID}']);
            var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
            g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
          })();
        `}
      </Script>
      <Suspense fallback={null}>
        <MatomoRouteTracker />
      </Suspense>
    </>
  );
}
