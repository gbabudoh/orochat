'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setCompassSponsorship } from '@/features/admin/compass-actions';

export default function CompassSponsorToggle({ compassId, isSponsored }: { compassId: string; isSponsored: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const toggle = async () => {
    setIsLoading(true);
    await setCompassSponsorship(compassId, { isSponsored: !isSponsored });
    setIsLoading(false);
    toast.success(isSponsored ? 'Sponsorship removed' : 'Marked as sponsored');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isLoading}
      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-60 ${
        isSponsored ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {isSponsored ? 'Sponsored' : 'Mark sponsored'}
    </button>
  );
}
