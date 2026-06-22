'use client';

import { useState } from 'react';
import type { PresenceStatus } from '@/lib/presence';

interface Props {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  presence?: PresenceStatus;
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

const presenceDotSizes = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

const presenceColors: Record<PresenceStatus, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-300',
};

export default function UserAvatar({ userId, name, avatarUrl, size = 'sm', className = '', presence }: Props) {
  const [failed, setFailed] = useState(false);

  const initial = name?.charAt(0).toUpperCase() || '?';
  const sizeClass = sizes[size];

  const presenceDot = presence && (
    <span
      className={`absolute bottom-0 right-0 ${presenceDotSizes[size]} rounded-full border-2 border-white ${presenceColors[presence]}`}
      aria-label={presence}
    />
  );

  if (failed) {
    return (
      <div className={`${sizeClass} rounded-full bg-linear-to-br from-[#458B9E] to-[#5BA3B8] flex items-center justify-center shrink-0 relative ${className}`}>
        <span className="text-white font-semibold">{initial}</span>
        {presenceDot}
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full shrink-0 relative ${className}`}>
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[#458B9E] to-[#5BA3B8] flex items-center justify-center">
          <span className="text-white font-semibold">{initial}</span>
        </div>
        <img
          src={`/api/user/${userId}/avatar?v=${avatarUrl ? encodeURIComponent(avatarUrl) : 'default'}`}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </div>
      {presenceDot}
    </div>
  );
}
