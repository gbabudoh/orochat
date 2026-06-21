'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import CommunityMembersModal from '@/components/feature/Compass/CommunityMembersModal';

interface CommunityMembersButtonProps {
  compassId: string;
  currentUserId: string;
  memberCount: number;
}

export default function CommunityMembersButton({ compassId, currentUserId, memberCount }: CommunityMembersButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[#458B9E] bg-[#458B9E]/10 hover:bg-[#458B9E]/20 transition-colors"
      >
        <Users className="w-4 h-4" />
        Members ({memberCount})
      </button>
      <CommunityMembersModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        compassId={compassId}
        currentUserId={currentUserId}
      />
    </>
  );
}
