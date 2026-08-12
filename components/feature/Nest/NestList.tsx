'use client';

import { useEffect, useState } from 'react';
import NestCard from '@/components/feature/Nest/NestCard';
import NewNestButton from '@/components/feature/Nest/NewNestButton';
import { getNests, archiveNest, unarchiveNest, deleteNest } from '@/features/nest/actions';
import { FolderGit2, FolderArchive, Kanban, FileText, Video } from 'lucide-react';
import NestHeaderGuide from '@/components/feature/Nest/NestHeaderGuide';
import HelpTooltip from '@/components/ui/HelpTooltip';

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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 shadow-2xs">
              <FolderGit2 className="w-5 h-5 text-[#458B9E]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">OroNest</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Dedicated project workspaces for you and your collaborating Oros.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <NestHeaderGuide />
          <NewNestButton currentUserId={currentUserId} />
        </div>
      </div>

      {/* Segmented Filter Control Track */}
      <div className="bg-slate-100/90 p-1.5 rounded-xl inline-flex items-center gap-1.5 border border-slate-200/60 shadow-2xs">
        <button
          type="button"
          onClick={() => setShowArchived(false)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2 select-none ${
            !showArchived
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <span>Active</span>
          <span
            className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md min-w-[18px] text-center transition-colors ${
              !showArchived ? 'bg-[#458B9E]/15 text-[#458B9E]' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {!showArchived ? nests.length : '•'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowArchived(true)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2 select-none ${
            showArchived
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <span>Archived</span>
          <span
            className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md min-w-[18px] text-center transition-colors ${
              showArchived ? 'bg-[#458B9E]/15 text-[#458B9E]' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {showArchived ? nests.length : '•'}
          </span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <p className="text-sm font-medium animate-pulse">Loading workspaces…</p>
        </div>
      ) : nests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 w-full max-w-full sm:max-w-2xl mx-auto px-4 py-8 sm:p-10 lg:p-12 text-center my-1">
          {showArchived ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-purple-50/90 border border-purple-200/80 text-purple-700 flex items-center justify-center mx-auto mb-5 shadow-2xs">
              <FolderArchive className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#458B9E]/10 border border-[#458B9E]/20 text-[#458B9E] flex items-center justify-center mx-auto mb-5 shadow-2xs">
              <FolderGit2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
            {showArchived ? 'No Archived Workspaces' : 'Create Your First OroNest'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed font-medium">
            {showArchived
              ? 'Archived workspaces will appear here. You can reactivate or delete them anytime.'
              : 'OroNest provides dedicated project workspaces for you and your collaborators to manage tasks, share notes, and host group calls in one place.'}
          </p>

          {showArchived ? (
            <button
              type="button"
              onClick={() => setShowArchived(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-all border border-slate-200 shadow-2xs cursor-pointer active:scale-[0.98]"
            >
              <span>View Active Workspaces</span>
            </button>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full sm:max-w-lg mx-auto mb-8 text-left">
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#458B9E]/10 text-[#458B9E] shrink-0">
                    <Kanban className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Task Boards</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#458B9E]/10 text-[#458B9E] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Shared Notes</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#458B9E]/10 text-[#458B9E] shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Group Calls</span>
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

