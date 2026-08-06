'use client';

import { Hash, Plus } from 'lucide-react';

interface ChannelSwitcherProps {
  channels: { id: string; name: string; conversationId: string }[];
  activeChannelId: string;
  onSelect: (channelId: string) => void;
  onNewChannel: () => void;
}

export default function ChannelSwitcher({ channels, activeChannelId, onSelect, onNewChannel }: ChannelSwitcherProps) {
  return (
    <div className="flex items-center sm:flex-col sm:items-stretch gap-1.5 sm:gap-1 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 mb-3 sm:mb-0 sm:w-44 sm:shrink-0 sm:border-r sm:border-gray-200 sm:pr-3">
      {channels.map((channel) => {
        const isActive = channel.id === activeChannelId;
        return (
          <button
            key={channel.id}
            type="button"
            onClick={() => onSelect(channel.id)}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-lg text-xs sm:text-sm font-semibold transition-all text-left ${
              isActive ? 'bg-[#458B9E] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
            <span className="truncate">{channel.name}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onNewChannel}
        className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-lg text-xs sm:text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-[#458B9E] transition-all"
      >
        <Plus className="w-3.5 h-3.5 shrink-0" />
        <span>New</span>
      </button>
    </div>
  );
}
