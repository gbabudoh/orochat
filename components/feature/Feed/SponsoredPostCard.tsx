'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { ExternalLink } from 'lucide-react';
import type { SponsoredAd } from '@/lib/ads/selectAd';

interface Props {
  ad: SponsoredAd;
  compassId?: string | null;
  index?: number;
}

export default function SponsoredPostCard({ ad, compassId = null, index = 0 }: Props) {
  const hasFiredImpression = useRef(false);

  useEffect(() => {
    if (hasFiredImpression.current) return;
    hasFiredImpression.current = true;
    fetch('/api/ads/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: ad.id, compassId }),
    }).catch(() => {});
  }, [ad.id, compassId]);

  const handleClick = () => {
    fetch('/api/ads/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: ad.id, compassId }),
    }).catch(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.05 }}
    >
      <Card padding="none" className="hover:shadow-lg transition-shadow p-3.5 sm:p-6 overflow-hidden border-dashed">
        <div className="flex items-center justify-between mb-2">
          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] sm:text-[10px] font-bold rounded-md uppercase tracking-wider">
            Sponsored
          </span>
          <span className="text-xs text-gray-400">{ad.advertiserName}</span>
        </div>

        <p className="font-semibold text-[#333333] text-sm sm:text-base mb-1.5">{ad.headline}</p>
        <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap wrap-break-word leading-relaxed">{ad.body}</p>

        {ad.imageUrl && (
          // Ad creative comes from arbitrary admin-entered URLs, not a
          // whitelisted domain, so next/image's domain restriction doesn't work here.
          <img
            src={ad.imageUrl}
            alt={ad.headline}
            className="w-full rounded-xl mb-3 max-h-96 object-cover"
          />
        )}

        <a
          href={ad.ctaUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#458B9E] hover:text-[#3a7585] transition-colors"
        >
          {ad.ctaLabel}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </Card>
    </motion.div>
  );
}
