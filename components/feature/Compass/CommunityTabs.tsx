'use client';

import { useState, type ReactNode } from 'react';
import { MessageSquare, MessageCircle } from 'lucide-react';

interface CommunityTabsProps {
  postsPanel: ReactNode;
  discussionPanel: ReactNode;
}

export default function CommunityTabs({ postsPanel, discussionPanel }: CommunityTabsProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'discussion'>('posts');

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'posts' ? 'border-[#458B9E] text-[#458B9E]' : 'border-transparent text-gray-500 hover:text-[#333333]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Posts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('discussion')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'discussion' ? 'border-[#458B9E] text-[#458B9E]' : 'border-transparent text-gray-500 hover:text-[#333333]'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Discussion
        </button>
      </div>

      {activeTab === 'posts' ? postsPanel : discussionPanel}
    </div>
  );
}
