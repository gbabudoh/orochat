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
        protocol: 'http',
        hostname: '149.102.155.247',
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

// Safe no-op without SENTRY_ORG/SENTRY_PROJECT set — only enables source map
// upload (for readable stack traces) once those env vars are configured.
export default withSentryConfig(withPWA(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
});
