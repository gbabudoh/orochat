'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import NewNestModal from '@/components/feature/Nest/NewNestModal';
import { Plus } from 'lucide-react';

export default function NewNestButton({ currentUserId }: { currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="rounded-full gap-1.5 whitespace-nowrap px-4"
      >
        <Plus className="w-4 h-4 shrink-0" />
        New Nest
      </Button>
      <NewNestModal isOpen={isOpen} onClose={() => setIsOpen(false)} currentUserId={currentUserId} />
    </>
  );
}
