import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/lib/providers/AuthProvider";
import QueryProvider from "@/lib/providers/QueryProvider";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MatomoAnalytics from "@/components/analytics/MatomoAnalytics";
import ClarityAnalytics from "@/components/analytics/ClarityAnalytics";
import PwaZoomPrevention from "@/components/layout/PwaZoomPrevention";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const SITE_NAME = 'Orochat';
const SITE_DESCRIPTION = 'The professional network where verified Oros and Compass communities turn real connections into a revenue share — entirely free, with no paywalls.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Your Network. Your Earnings.`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Your Network. Your Earnings.`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: '/logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Your Network. Your Earnings.`,
    description: SITE_DESCRIPTION,
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'hRS5o3hCDp_WBWu51iriW1E5_KFaiHztBndERAY6c9E',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Lets installed/standalone PWA content extend into the iOS notch/home-
  // indicator safe areas (paired with statusBarStyle: 'black-translucent'
  // above and the env(safe-area-inset-*) padding used throughout the UI).
  viewportFit: 'cover',
  themeColor: '#458B9E',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: SITE_DESCRIPTION,
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/explore?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PwaZoomPrevention />
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
        <GoogleAnalytics />
        <MatomoAnalytics />
        <ClarityAnalytics />
      </body>
    </html>
  );
}
