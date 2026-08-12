'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import NewNestModal from '@/components/feature/Nest/NewNestModal';
import { Plus } from 'lucide-react';

export default function NewNestButton({ currentUserId }: { currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
      >
        <Plus className="w-4 h-4 text-white/90 shrink-0" />
        <span>New Nest</span>
      </button>
      <NewNestModal isOpen={isOpen} onClose={() => setIsOpen(false)} currentUserId={currentUserId} />
    </>
  );
}
