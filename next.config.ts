import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // geoip-lite reads its .dat files via __dirname at require time — bundling
  // it rewrites that path and breaks the lookup, so it must load natively.
  serverExternalPackages: ['geoip-lite'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.feendesk.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 's3.feendesk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.feendesk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.feendesk.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '149.102.155.247',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withSentryConfig(withPWA(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
});
