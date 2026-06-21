'use client';

import { Trash2, Calendar } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { formatDate } from '@/lib/utils/formatters';

export type NestTaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface NestTaskItem {
  id: string;
  title: string;
  description: string | null;
  status: NestTaskStatus;
  dueDate: Date | string | null;
  assignee: { id: string; name: string; avatar: string | null } | null;
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
}

export default function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[#333333]">{task.title}</p>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
          aria-label="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {task.description && <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>}

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
