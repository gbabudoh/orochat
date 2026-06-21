'use client';

import Link from 'next/link';
import { FolderKanban, ListChecks } from 'lucide-react';
import Card from '@/components/ui/Card';
import UserAvatar from '@/components/ui/UserAvatar';

interface NestCardProps {
  nest: {
    id: string;
    name: string;
    members: { user: { id: string; name: string; avatar: string | null } }[];
    _count: { tasks: number };
  };
}

export default function NestCard({ nest }: NestCardProps) {
  return (
    <Link href={`/nest/${nest.id}`}>
      <Card hover className="h-full">
        <div className="w-full h-20 bg-gradient-to-br from-[#458B9E] to-[#3a7585] rounded-lg mb-4 flex items-center justify-center">
          <FolderKanban className="w-10 h-10 text-white/50" />
        </div>
        <h3 className="text-lg font-semibold text-[#333333] mb-2 truncate">{nest.name}</h3>
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
  );
}
