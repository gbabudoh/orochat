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
      <Card hover className="h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all hover:border-[#458B9E]/40 p-4">
        <div>
          <div className="relative mb-4 overflow-hidden rounded-xl">
            {compass.image ? (
              <img
                src={compass.image}
                alt={compass.name}
                className="w-full h-36 sm:h-40 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-36 sm:h-40 bg-gradient-to-br from-[#458B9E] via-[#366f7e] to-[#2a5662] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
                <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md">
                  <Compass className="w-7 h-7 text-white" />
                </div>
              </div>
            )}
            {compass.isSponsored && (
              <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-amber-400 to-amber-300 text-amber-950 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-xs flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 shrink-0" />
                <span>Sponsored</span>
              </div>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1.5 group-hover:text-[#458B9E] transition-colors leading-snug tracking-tight">
            {compass.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mb-4 line-clamp-2 leading-relaxed">
            {compass.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
          <div className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 font-bold">
            <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{compass._count?.memberships || 0} members</span>
          </div>

          <span className="inline-flex items-center gap-1 text-[#458B9E] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Explore <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}


