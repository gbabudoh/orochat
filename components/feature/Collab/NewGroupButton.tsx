'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import NewGroupModal from '@/components/feature/Collab/NewGroupModal';
import { Users } from 'lucide-react';

export default function NewGroupButton({ currentUserId }: { currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setIsOpen(true)}>
        <Users className="w-4 h-4 mr-1.5" />
        New Group
      </Button>
      <NewGroupModal isOpen={isOpen} onClose={() => setIsOpen(false)} currentUserId={currentUserId} />
    </>
  );
}
