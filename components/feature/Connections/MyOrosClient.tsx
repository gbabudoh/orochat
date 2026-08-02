'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { Search, X, Users, MessageSquare, User, Video, Sparkles, UserPlus } from 'lucide-react';

interface ConnectionItem {
  id: string;
  oro: {
    id: string;
    name: string;
    avatar: string | null;
    title: string | null;
    company: string | null;
    location?: string | null;
    consultEnabled: boolean;
  };
}

interface Props {
  connections: ConnectionItem[];
  presenceByUserId: Record<string, string>;
  sessionUserId: string;
}

export default function MyOrosClient({ connections, presenceByUserId }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'online' | 'consults'>('all');

  const filteredConnections = connections.filter((conn) => {
    const oro = conn.oro;
    const isOnline = presenceByUserId[oro.id] === 'online';

    // Tab filter
    if (filterTab === 'online' && !isOnline) return false;
    if (filterTab === 'consults' && !oro.consultEnabled) return false;

    // Search filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      oro.name.toLowerCase().includes(query) ||
      (oro.title && oro.title.toLowerCase().includes(query)) ||
      (oro.company && oro.company.toLowerCase().includes(query)) ||
      (oro.location && oro.location.toLowerCase().includes(query))
    );
  });

  const onlineCount = connections.filter((c) => presenceByUserId[c.oro.id] === 'online').length;
  const consultsCount = connections.filter((c) => c.oro.consultEnabled).length;

  return (
    <div className="space-y-5">
      {/* Controls Bar: Filter Tabs + Search Box */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <HelpTooltip
            title="Connection Directory Filters"
            description="Filter verified connections by real-time presence or bookable consultation availability."
            tips={[
              'Click Online Now to find connections currently active for instant messaging.',
              'Click Bookable Consults to view Oros offering paid video sessions.',
              'Use the search box to find connections by name, company, or title.',
            ]}
          />
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#458B9E] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Oros ({connections.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('online')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'online'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Online Now ({onlineCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('consults')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'consults'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Bookable Consults ({consultsCount})
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative flex items-center min-w-[260px] sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search connections by name or company…"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-xs sm:text-sm transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Connection Grid */}
      {filteredConnections.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredConnections.map((connection) => {
            const oro = connection.oro;
            const isOnline = presenceByUserId[oro.id] === 'online';

            return (
              <Card
                key={connection.id}
                hover
                className="p-5 border border-gray-200/90 rounded-2xl transition-all duration-300 bg-white flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/oro/${oro.id}?from=oro`} className="shrink-0">
                      <UserAvatar
                        userId={oro.id}
                        name={oro.name}
                        avatarUrl={oro.avatar}
                        size="lg"
                        presence={isOnline ? 'online' : 'offline'}
                      />
                    </Link>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        isOnline
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-gray-50 text-gray-500 border border-gray-200/60'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                        }`}
                      />
                      <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </span>
                  </div>

                  <div>
                    <Link href={`/oro/${oro.id}?from=oro`}>
                      <h3 className="font-bold text-gray-900 hover:text-[#458B9E] transition-colors truncate text-base leading-snug">
                        {oro.name}
                      </h3>
                    </Link>

                    {oro.title && <p className="text-xs text-gray-600 truncate mt-0.5">{oro.title}</p>}
                    {oro.company && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{oro.company}</p>
                    )}

                    {oro.consultEnabled && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded-full border border-purple-200">
                        <Video className="w-3 h-3 text-purple-600" />
                        <span>Bookable Consult</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <Link href={`/collab/${oro.id}`} className="flex-1 min-w-0">
                    <Button
                      size="sm"
                      className="w-full text-xs py-2 rounded-xl bg-[#458B9E] text-white hover:bg-[#397484] shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1 shrink-0" />
                      <span>Message</span>
                    </Button>
                  </Link>

                  <Link href={`/oro/${oro.id}?from=oro`} className="flex-1 min-w-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-[#458B9E] hover:text-[#458B9E] cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 mr-1 shrink-0" />
                      <span>Profile</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <Card className="rounded-2xl border border-gray-200/90 p-8 sm:p-12 text-center bg-white">
          <div className="w-16 h-16 rounded-2xl bg-[#458B9E]/10 flex items-center justify-center mx-auto mb-4 text-[#458B9E]">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {connections.length === 0 ? 'No Oros yet' : 'No matching Oros found'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
            {connections.length === 0
              ? 'Start connecting with professionals to build your verified Oro network.'
              : 'Try clearing your search query or switching filter tabs.'}
          </p>
          <Link href="/oro/discover">
            <Button className="rounded-full px-6 text-xs sm:text-sm py-2">
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>Find People</span>
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
