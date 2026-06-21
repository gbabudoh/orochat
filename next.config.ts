import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
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

// Safe no-op without SENTRY_ORG/SENTRY_PROJECT set — only enables source map
// upload (for readable stack traces) once those env vars are configured.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
});
