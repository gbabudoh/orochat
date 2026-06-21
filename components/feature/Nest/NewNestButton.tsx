'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import NewNestModal from '@/components/feature/Nest/NewNestModal';
import { Plus } from 'lucide-react';

export default function NewNestButton({ currentUserId }: { currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-1.5" />
        New Nest
      </Button>
      <NewNestModal isOpen={isOpen} onClose={() => setIsOpen(false)} currentUserId={currentUserId} />
    </>
  );
}
