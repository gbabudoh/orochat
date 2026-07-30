'use client';

import Link from 'next/link';
import { Users, Crown, Compass, ArrowRight } from 'lucide-react';
import Card from '@/components/ui/Card';

interface CommunityCardProps {
  compass: {
    id: string;
    slug: string;
    name: string;
    description: string;
    image?: string | null;
    isSponsored?: boolean;
    _count?: {
      memberships: number;
    };
  };
}

export default function CommunityCard({ compass }: CommunityCardProps) {
  return (
    <Link href={`/compass/${compass.slug}`} className="block h-full group">
      <Card hover className="h-full flex flex-col justify-between p-4 sm:p-5 border border-gray-200/90 rounded-2xl transition-all duration-300 group-hover:border-[#458B9E]/50 group-hover:shadow-md">
        <div>
          <div className="relative mb-4 overflow-hidden rounded-xl">
            {compass.image ? (
              <img
                src={compass.image}
                alt={compass.name}
                className="w-full h-36 sm:h-40 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-36 sm:h-40 bg-gradient-to-br from-[#458B9E] via-[#3a7585] to-[#2c5a67] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center shadow-inner">
                  <Compass className="w-8 h-8 text-white/90" />
                </div>
              </div>
            )}
            {compass.isSponsored && (
              <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-amber-400 to-amber-300 text-amber-950 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 shrink-0" />
                <span>Sponsored</span>
              </div>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 group-hover:text-[#458B9E] transition-colors leading-snug">
            {compass.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            {compass.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#458B9E]/10 text-[#458B9E] font-medium">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>{compass._count?.memberships || 0} members</span>
          </div>

          <span className="flex items-center gap-1 text-xs font-semibold text-[#458B9E] group-hover:translate-x-0.5 transition-transform">
            Explore <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}


