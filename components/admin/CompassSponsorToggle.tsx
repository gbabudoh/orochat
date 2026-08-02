'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setCompassSponsorship } from '@/features/admin/compass-actions';
import { Sparkles, Star } from 'lucide-react';

export default function CompassSponsorToggle({ compassId, isSponsored }: { compassId: string; isSponsored: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const toggle = async () => {
    setIsLoading(true);
    await setCompassSponsorship(compassId, { isSponsored: !isSponsored });
    setIsLoading(false);
    toast.success(isSponsored ? 'Sponsorship status removed' : 'Community marked as sponsored');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isLoading}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border disabled:opacity-60 cursor-pointer ${
        isSponsored
          ? 'bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs hover:bg-amber-100'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
      }`}
    >
      {isSponsored ? (
        <>
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>Sponsored</span>
        </>
      ) : (
        <>
          <Star className="w-3.5 h-3.5 text-gray-400" />
          <span>Mark Sponsored</span>
        </>
      )}
    </button>
  );
}
