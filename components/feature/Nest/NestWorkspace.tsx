'use client';

import { useState } from 'react';
import { FolderKanban, ListChecks, StickyNote, MessageSquare } from 'lucide-react';
import TaskBoard from '@/components/feature/Nest/TaskBoard';
import NotesEditor from '@/components/feature/Nest/NotesEditor';
import ChatRoom from '@/components/feature/Collab/ChatRoom';

interface Member {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
}

interface NestWorkspaceProps {
  nestId: string;
  nestName: string;
  ownerId: string;
  conversationId: string;
  members: Member[];
  currentUserId: string;
}

type Tab = 'board' | 'notes' | 'chat';

const TABS: { id: Tab; label: string; icon: typeof ListChecks }[] = [
  { id: 'board', label: 'Board', icon: ListChecks },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
];

export default function NestWorkspace({ nestId, nestName, conversationId, members, currentUserId }: NestWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<Tab>('board');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#458B9E] flex items-center justify-center shrink-0">
          <FolderKanban className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#333333] truncate">{nestName}</h1>
          <p className="text-sm text-gray-500">{members.length} member{members.length === 1 ? '' : 's'}</p>
        </div>
      </div>

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
      {activeTab === 'chat' && <ChatRoom conversationId={conversationId} currentUserId={currentUserId} />}
    </div>
  );
}
