'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderKanban, ListChecks, StickyNote, MessageSquare, Paperclip, ArchiveRestore, ArrowLeft } from 'lucide-react';
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

export default function NestWorkspace({ nestId, nestName, ownerId, conversationId, members, currentUserId, archived, expiresAt, backHref = '/nest', backLabel = 'Back to OroNest', channels }: NestWorkspaceProps) {
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
    <div className="max-w-6xl mx-auto">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#458B9E] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#458B9E] flex items-center justify-center shrink-0">
          <FolderKanban className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#333333] truncate">{nestName}</h1>
          <p className="text-sm text-gray-500">{members.length} member{members.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {isArchived && (
        <div className="flex items-center justify-between gap-3 mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-700">
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

      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-[#458B9E] text-[#458B9E]'
                  : 'border-transparent text-gray-500 hover:text-[#333333]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
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
