'use client';

import { useState } from 'react';
import { User, Award } from 'lucide-react';

interface ProfileAvatarProps {
  userId: string;
  name: string;
  hasAvatar: boolean;
  isPartner?: boolean;
  size?: 'md' | 'lg';
}

export default function ProfileAvatar({
  userId,
  name,
  hasAvatar,
  isPartner = false,
  size = 'md',
}: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || '?';

  const containerSizeClass = size === 'lg' ? 'w-36 h-36 md:w-44 md:h-44' : 'w-24 h-24 md:w-36 md:h-36';
  const innerRoundedClass = size === 'lg' ? 'rounded-2xl' : 'rounded-xl';
  const iconSizeClass = size === 'lg' ? 'w-16 h-16 md:w-20 md:h-20' : 'w-10 h-10 md:w-16 md:h-16';
  const textSizeClass = size === 'lg' ? 'text-3xl md:text-5xl' : 'text-2xl md:text-4xl';

  const showInitialFallback = !hasAvatar || imageError;

  return (
    <div className="relative inline-block">
      <div className={`${containerSizeClass} rounded-2xl md:rounded-3xl bg-white p-1.5 md:p-2 shadow-2xl transition-transform hover:scale-[1.02]`}>
        <div className={`w-full h-full ${innerRoundedClass} bg-gradient-to-br from-[#458B9E] via-[#3a7585] to-[#2c5a67] flex items-center justify-center overflow-hidden relative shadow-inner`}>
          {!showInitialFallback ? (
            <img
              src={`/api/user/${userId}/avatar`}
              alt=""
              className={`w-full h-full object-cover ${innerRoundedClass}`}
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#458B9E] to-[#2c5a67]">
              {initial ? (
                <span className={`text-white font-bold tracking-wider ${textSizeClass} drop-shadow-sm`}>
                  {initial}
                </span>
              ) : (
                <User className={`${iconSizeClass} text-white/90`} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
