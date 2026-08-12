'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderKanban, ListChecks, StickyNote, MessageSquare, Paperclip, ArchiveRestore, ArrowLeft, Users2 } from 'lucide-react';
import TaskBoard from '@/components/feature/Nest/TaskBoard';
import NotesEditor from '@/components/feature/Nest/NotesEditor';
import FileList from '@/components/feature/Nest/FileList';
import ChatRoom from '@/components/feature/Collab/ChatRoom';
import ChannelSwitcher from '@/components/feature/Nest/ChannelSwitcher';
import NewChannelModal from '@/components/feature/Nest/NewChannelModal';
import Button from '@/components/ui/Button';
import { unarchiveNest } from '@/features/nest/actions';
import { useRouter } from 'next/navigation';

interface Member {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
}

interface Channel {
  id: string;
  name: string;
  conversationId: string;
}

interface NestWorkspaceProps {
  nestId: string;
  nestName: string;
  ownerId: string;
  conversationId: string;
  members: Member[];
  currentUserId: string;
  archived: boolean;
  expiresAt: Date | string | null;
  backHref?: string;
  backLabel?: string;
  statusBadge?: string;
  /** Oroslate Slates only — a free Nest never passes this, so it keeps today's single-chat layout. */
  channels?: Channel[];
}

type Tab = 'board' | 'notes' | 'files' | 'chat';

const TABS: { id: Tab; label: string; icon: typeof ListChecks }[] = [
  { id: 'board', label: 'Board', icon: ListChecks },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'files', label: 'Files', icon: Paperclip },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
];

export default function NestWorkspace({
  nestId,
  nestName,
  ownerId,
  conversationId,
  members,
  currentUserId,
  archived,
  expiresAt,
  backHref = '/nest',
  backLabel = 'Back to OroNest',
  statusBadge,
  channels,
}: NestWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<Tab>('board');
  const [isArchived, setIsArchived] = useState(archived);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [channelList, setChannelList] = useState(channels ?? []);
  const [activeChannelId, setActiveChannelId] = useState(channelList[0]?.id);
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const router = useRouter();
  const isOwner = ownerId === currentUserId;

  const activeConversationId = channels
    ? (channelList.find((c) => c.id === activeChannelId)?.conversationId ?? conversationId)
    : conversationId;

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      await unarchiveNest(nestId, currentUserId);
      setIsArchived(false);
      router.refresh();
    } finally {
      setIsUnarchiving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Back Navigation Button */}
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all shrink-0 active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 text-[#458B9E]" />
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#458B9E] to-[#366f7e] flex items-center justify-center shrink-0 shadow-md shadow-[#458B9E]/20 text-white">
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate tracking-tight">
              {nestName}
            </h1>
            <div className="flex items-center gap-2">
              {statusBadge && (
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#458B9E]/15 text-[#458B9E] border border-[#458B9E]/20 shadow-2xs">
                  {statusBadge}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                <Users2 className="w-3.5 h-3.5 text-slate-500" />
                {members.length} member{members.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isArchived && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 shadow-2xs">
          <p className="text-xs sm:text-sm font-semibold text-amber-800">
            This Nest is archived{expiresAt ? ' (its time limit ran out)' : ''}.
          </p>
          {isOwner && (
            <Button variant="secondary" size="sm" onClick={handleUnarchive} isLoading={isUnarchiving}>
              <ArchiveRestore className="w-4 h-4 mr-1.5" />
              Unarchive
            </Button>
          )}
        </div>
      )}

      {/* Segmented Control Mode Track */}
      <div className="bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/60 shadow-2xs inline-flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto snap-x whitespace-nowrap scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#458B9E]' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'board' && <TaskBoard nestId={nestId} currentUserId={currentUserId} members={members} />}
      {activeTab === 'notes' && <NotesEditor nestId={nestId} currentUserId={currentUserId} />}
      {activeTab === 'files' && <FileList nestId={nestId} currentUserId={currentUserId} nestOwnerId={ownerId} />}
      {activeTab === 'chat' && (
        channels ? (
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <ChannelSwitcher
              channels={channelList}
              activeChannelId={activeChannelId ?? channelList[0]?.id}
              onSelect={setActiveChannelId}
              onNewChannel={() => setIsNewChannelOpen(true)}
            />
            <div className="flex-1 min-w-0">
              <ChatRoom key={activeConversationId} conversationId={activeConversationId} currentUserId={currentUserId} />
            </div>
          </div>
        ) : (
          <ChatRoom conversationId={activeConversationId} currentUserId={currentUserId} />
        )
      )}

      {channels && (
        <NewChannelModal
          isOpen={isNewChannelOpen}
          onClose={() => setIsNewChannelOpen(false)}
          nestId={nestId}
          currentUserId={currentUserId}
          onCreated={(channel) => {
            setChannelList((prev) => [...prev, channel]);
            setActiveChannelId(channel.id);
          }}
        />
      )}
    </div>
  );
}
