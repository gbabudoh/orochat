'use client';

import Link from 'next/link';
import { Users, Crown, Compass } from 'lucide-react';
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
    <Link href={`/compass/${compass.slug}`}>
      <Card hover className="h-full">
        <div className="relative">
          {compass.image ? (
            <img
              src={compass.image}
              alt={compass.name}
              className="w-full h-32 object-cover rounded-lg mb-4"
            />
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-[#458B9E] to-[#3a7585] rounded-lg mb-4 flex items-center justify-center">
              <Compass className="w-12 h-12 text-white/50" />
            </div>
          )}
          {compass.isSponsored && (
            <div className="absolute top-2 right-2 bg-[#FFC93C] text-[#333333] px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
              <Crown className="w-3 h-3" />
              <span>Sponsored</span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-[#333333] mb-2">{compass.name}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{compass.description}</p>
        <div className="flex items-center text-sm text-gray-500">
          <Users className="w-4 h-4 mr-2" />
          <span>{compass._count?.memberships || 0} members</span>
        </div>
      </Card>
    </Link>
  );
}

