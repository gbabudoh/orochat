'use client';

import { useState } from 'react';

interface Props {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

export default function UserAvatar({ userId, name, avatarUrl, size = 'sm', className = '' }: Props) {
  const [failed, setFailed] = useState(false);

  const initial = name?.charAt(0).toUpperCase() || '?';
  const sizeClass = sizes[size];

  if (failed) {
    return (
      <div className={`${sizeClass} rounded-full bg-linear-to-br from-[#458B9E] to-[#5BA3B8] flex items-center justify-center shrink-0 ${className}`}>
        <span className="text-white font-semibold">{initial}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full shrink-0 overflow-hidden relative ${className}`}>
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
  );
}
