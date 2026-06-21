'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderKanban, ListChecks, MoreVertical, Archive, ArchiveRestore, Trash2, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import UserAvatar from '@/components/ui/UserAvatar';

interface NestCardProps {
  nest: {
    id: string;
    name: string;
    ownerId: string;
    archived: boolean;
    expiresAt: Date | string | null;
    members: { user: { id: string; name: string; avatar: string | null } }[];
    _count: { tasks: number };
  };
  currentUserId: string;
  onArchive: (nestId: string) => void;
  onUnarchive: (nestId: string) => void;
  onDelete: (nestId: string) => void;
}

function formatDaysLeft(expiresAt: Date | string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export default function NestCard({ nest, currentUserId, onArchive, onUnarchive, onDelete }: NestCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isOwner = nest.ownerId === currentUserId;

  return (
    <div className="relative">
      <Link href={`/nest/${nest.id}`}>
        <Card hover className="h-full">
          <div className="w-full h-20 bg-gradient-to-br from-[#458B9E] to-[#3a7585] rounded-lg mb-4 flex items-center justify-center">
            <FolderKanban className="w-10 h-10 text-white/50" />
          </div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-[#333333] truncate">{nest.name}</h3>
          </div>
          {nest.expiresAt && !nest.archived && (
            <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
              <Clock className="w-3.5 h-3.5" />
              {formatDaysLeft(nest.expiresAt)}
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <ListChecks className="w-4 h-4" />
              <span>{nest._count.tasks} tasks</span>
            </div>
            <div className="flex -space-x-2">
              {nest.members.slice(0, 4).map((m) => (
                <UserAvatar
                  key={m.user.id}
                  userId={m.user.id}
                  name={m.user.name}
                  avatarUrl={m.user.avatar}
                  size="sm"
                  className="ring-2 ring-white"
                />
              ))}
            </div>
          </div>
        </Card>
      </Link>

      {isOwner && (
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen((v) => !v);
            }}
            className="p-1.5 rounded-lg bg-white/90 text-gray-500 hover:bg-white hover:text-[#333333] shadow-sm transition-colors"
            aria-label="Nest options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {isMenuOpen && (
            <div
              className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {nest.archived ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onUnarchive(nest.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#333333] hover:bg-[#F0F3F7] transition-colors"
                >
                  <ArchiveRestore className="w-4 h-4" />
                  Unarchive
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onArchive(nest.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#333333] hover:bg-[#F0F3F7] transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(nest.id);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
