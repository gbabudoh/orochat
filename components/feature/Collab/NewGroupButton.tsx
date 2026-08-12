'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import NewGroupModal from '@/components/feature/Collab/NewGroupModal';
import { Users } from 'lucide-react';

export default function NewGroupButton({ currentUserId }: { currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
      >
        <Users className="w-3.5 h-3.5 text-white/90" />
        <span>New Group</span>
      </button>
      <NewGroupModal isOpen={isOpen} onClose={() => setIsOpen(false)} currentUserId={currentUserId} />
    </>
  );
}
