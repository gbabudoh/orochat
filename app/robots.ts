import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Authenticated-only app routes — nothing useful for a crawler to index,
// and most would just redirect to /login anyway.
const DISALLOWED = [
  '/api/',
  '/feed',
  '/global',
  '/collab',
  '/nest',
  '/compass',
  '/oro/discover',
  '/settings',
  '/reset-password',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Generic rule for all crawlers, including AI/LLM crawlers
        // (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) — none
        // are singled out for blocking, since being citable by AI answer
        // engines is part of this site's SEO strategy, not a risk.
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
