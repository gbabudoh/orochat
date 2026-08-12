'use client';

import Link from 'next/link';
import { FolderKanban, ListChecks } from 'lucide-react';
import Card from '@/components/ui/Card';
import UserAvatar from '@/components/ui/UserAvatar';

interface SlateCardProps {
  slate: {
    id: string;
    name: string;
    members: { user: { id: string; name: string; avatar: string | null } }[];
    _count: { tasks: number };
  };
}

export default function SlateCard({ slate }: SlateCardProps) {
  return (
    <Link href={`/oroslate/slate/${slate.id}`} className="group block h-full">
      <Card hover className="h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all hover:border-[#458B9E]/40 p-4">
        <div>
          {/* Slate Banner */}
          <div className="relative overflow-hidden w-full h-24 bg-gradient-to-br from-[#458B9E] via-[#366f7e] to-[#2a5662] rounded-xl mb-4 flex items-center justify-center p-4 shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md">
              <FolderKanban className="w-5.5 h-5.5 text-white" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-[#458B9E] transition-colors truncate tracking-tight mb-3">
            {slate.name}
          </h3>
        </div>

        {/* Footer / Stats */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 font-bold">
            <ListChecks className="w-3.5 h-3.5 text-slate-500" />
            <span>{slate._count.tasks} tasks</span>
          </div>
          <div className="flex -space-x-2 shrink-0">
            {slate.members.slice(0, 4).map((m) => (
              <UserAvatar
                key={m.user.id}
                userId={m.user.id}
                name={m.user.name}
                avatarUrl={m.user.avatar}
                size="sm"
                className="ring-2 ring-white shadow-2xs"
              />
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
