import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import ManageCookiePreferencesButton from '@/components/consent/ManageCookiePreferencesButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  alternates: { canonical: '/legal/cookies' },
};

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#458B9E] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Home
      </Link>

      <Card padding="lg">
        <h1 className="text-4xl font-bold text-[#333333] mb-6">Cookie Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-600">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          <p className="mb-6">
            This Cookie Policy explains what cookies Orochat uses, why, and how you can control them. You
            can change your choice at any time from this page, or by clicking &ldquo;Manage
            Preferences&rdquo; on the cookie banner when it first appears.
          </p>

          <div className="mb-2">
            <ManageCookiePreferencesButton />
          </div>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">What are cookies?</h2>
          <p className="mb-4">
            Cookies are small text files stored on your device that let a website remember information
            about your visit, such as your preferences or login state.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Strictly necessary cookies</h2>
          <p className="mb-4">
            These are required for Orochat to function and cannot be switched off. They include your
            login session, security tokens (CSRF protection), and your cookie consent choice itself. We
            do not ask for consent to set these, as they are essential to providing the service you
            requested.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Analytics cookies (optional)</h2>
          <p className="mb-4">
            With your permission, we use the following third-party analytics services to understand how
            Orochat is used, so we can improve it. None of these are loaded or set until you accept
            analytics cookies:
          </p>
          <ul className="mb-4 list-disc pl-6 space-y-2">
            <li>
              <strong>Google Analytics</strong> (Google LLC) — page views and usage patterns.
            </li>
            <li>
              <strong>Microsoft Clarity</strong> (Microsoft Corporation) — anonymised interaction and
              session-behaviour analytics.
            </li>
            <li>
              <strong>Matomo</strong> — self-hosted usage analytics on our own infrastructure.
            </li>
          </ul>
          <p className="mb-4">
            Google and Microsoft may process this data outside the UK/EEA. Where this happens, it is done
            under appropriate safeguards (such as Standard Contractual Clauses). Data is retained by each
            provider only for as long as necessary for the purposes described above, in line with that
            provider&apos;s own retention settings.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Changing your choice</h2>
          <p className="mb-4">
            You can accept, reject, or change your analytics cookie preference at any time — there is no
            need to keep re-deciding on every visit. Your choice is remembered for up to a year, or until
            you change it, whichever comes first.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">More information</h2>
          <p className="mb-4">
            See our <Link href="/legal/privacy" className="text-[#458B9E] hover:underline">Privacy Policy</Link> for
            how we handle your personal data more broadly. If you have questions about this Cookie
            Policy, please contact us.
          </p>
        </div>
      </Card>
    </div>
  );
}
