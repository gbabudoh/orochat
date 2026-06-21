'use client';

import { useEffect, useState } from 'react';
import NestCard from '@/components/feature/Nest/NestCard';
import NewNestButton from '@/components/feature/Nest/NewNestButton';
import { getNests, archiveNest, unarchiveNest, deleteNest } from '@/features/nest/actions';

type NestListItem = Awaited<ReturnType<typeof getNests>>[number];

interface NestListProps {
  currentUserId: string;
  initialNests: NestListItem[];
}

export default function NestList({ currentUserId, initialNests }: NestListProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [nests, setNests] = useState<NestListItem[]>(initialNests);
  const [isLoading, setIsLoading] = useState(false);

  const load = async (archived: boolean) => {
    setIsLoading(true);
    const result = await getNests(currentUserId, archived);
    setNests(result);
    setIsLoading(false);
  };

  useEffect(() => {
    if (showArchived) load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const handleArchive = async (nestId: string) => {
    await archiveNest(nestId, currentUserId);
    load(showArchived);
  };

  const handleUnarchive = async (nestId: string) => {
    await unarchiveNest(nestId, currentUserId);
    load(showArchived);
  };

  const handleDelete = async (nestId: string) => {
    await deleteNest(nestId, currentUserId);
    load(showArchived);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">OroNest</h1>
          <p className="text-sm text-gray-500 mt-1">Project workspaces for you and your Oros</p>
        </div>
        <NewNestButton currentUserId={currentUserId} />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setShowArchived(false)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!showArchived ? 'bg-[#458B9E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setShowArchived(true)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${showArchived ? 'bg-[#458B9E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Archived
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-12">Loading…</p>
      ) : nests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">{showArchived ? 'No archived Nests' : 'No Nests yet'}</p>
          {!showArchived && <NewNestButton currentUserId={currentUserId} />}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nests.map((nest) => (
            <NestCard
              key={nest.id}
              nest={nest}
              currentUserId={currentUserId}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
