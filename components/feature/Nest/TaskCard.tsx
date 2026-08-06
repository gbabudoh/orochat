'use client';

import { Trash2, Calendar, Link2 } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { formatDate } from '@/lib/utils/formatters';

export type NestTaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface TaskDependencyItem {
  id: string;
  dependsOn: { id: string; title: string; status: NestTaskStatus };
}

export interface NestTaskItem {
  id: string;
  title: string;
  description: string | null;
  status: NestTaskStatus;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  assignee: { id: string; name: string; avatar: string | null } | null;
  creator: { id: string; name: string; avatar: string | null };
  blockedBy: TaskDependencyItem[];
}

const STATUS_OPTIONS: { value: NestTaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

interface TaskCardProps {
  task: NestTaskItem;
  onStatusChange: (taskId: string, status: NestTaskStatus) => void;
  onDelete: (taskId: string) => void;
  onOpen: (taskId: string) => void;
}

export default function TaskCard({ task, onStatusChange, onDelete, onOpen }: TaskCardProps) {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-3 space-y-2 cursor-pointer hover:border-[#458B9E]/50 transition-colors"
      onClick={() => onOpen(task.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[#333333]">{task.title}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
          aria-label="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {task.description && <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>}

      {task.blockedBy.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
          <Link2 className="w-3 h-3 shrink-0" />
          <span className="truncate">Blocked by: {task.blockedBy.map((d) => d.dependsOn.title).join(', ')}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <UserAvatar userId={task.assignee.id} name={task.assignee.name} avatarUrl={task.assignee.avatar} size="sm" />
            <span className="text-xs text-gray-500 truncate">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Unassigned</span>
        )}
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
            <Calendar className="w-3 h-3" />
            {formatDate(task.dueDate)}
          </div>
        )}
      </div>

      <select
        value={task.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onStatusChange(task.id, e.target.value as NestTaskStatus)}
        className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-[#333333] focus:border-[#458B9E] focus:ring-1 focus:ring-[#458B9E]/20"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
