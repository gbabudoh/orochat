'use client';

import { useEffect, useState } from 'react';
import NestCard from '@/components/feature/Nest/NestCard';
import NewNestButton from '@/components/feature/Nest/NewNestButton';
import { getNests, archiveNest, unarchiveNest, deleteNest } from '@/features/nest/actions';
import { FolderGit2, FolderArchive, Kanban, FileText, Video } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#333333]">OroNest</h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Project workspaces for you and your Oros
          </p>
        </div>
        <div className="shrink-0">
          <NewNestButton currentUserId={currentUserId} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setShowArchived(false)}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs ${
            !showArchived
              ? 'bg-[#458B9E] text-white ring-2 ring-[#458B9E]/20'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setShowArchived(true)}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs ${
            showArchived
              ? 'bg-[#458B9E] text-white ring-2 ring-[#458B9E]/20'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Archived
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-sm font-medium animate-pulse">Loading workspaces…</p>
        </div>
      ) : nests.length === 0 ? (
        <div className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-2xl shadow-sm border border-gray-200/90 p-6 sm:p-10 lg:p-12 text-center max-w-2xl mx-auto my-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#458B9E] to-[#3a7585] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#458B9E]/20">
            {showArchived ? (
              <FolderArchive className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            ) : (
              <FolderGit2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {showArchived ? 'No Archived Workspaces' : 'Create Your First OroNest'}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
            {showArchived
              ? 'Archived workspaces will appear here. You can reactivate or delete them anytime.'
              : 'OroNest provides dedicated project workspaces for you and your collaborators to manage tasks, share notes, and host group calls in one place.'}
          </p>

          {!showArchived && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-8 text-left">
                <div className="p-3 rounded-xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-2.5">
                  <Kanban className="w-4 h-4 text-[#458B9E] shrink-0" />
                  <span className="text-xs font-semibold text-gray-700">Task Boards</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#458B9E] shrink-0" />
                  <span className="text-xs font-semibold text-gray-700">Shared Notes</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-[#458B9E] shrink-0" />
                  <span className="text-xs font-semibold text-gray-700">Group Calls</span>
                </div>
              </div>

              <div className="inline-block">
                <NewNestButton currentUserId={currentUserId} />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

