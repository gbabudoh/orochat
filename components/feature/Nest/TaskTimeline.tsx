'use client';

import { Link2 } from 'lucide-react';
import type { NestTaskItem, NestTaskStatus } from '@/components/feature/Nest/TaskCard';
import { formatDate } from '@/lib/utils/formatters';

interface TaskTimelineProps {
  tasks: NestTaskItem[];
  onOpen: (taskId: string) => void;
}

const STATUS_BAR_COLOR: Record<NestTaskStatus, string> = {
  TODO: 'bg-gray-300',
  IN_PROGRESS: 'bg-[#458B9E]',
  DONE: 'bg-emerald-500',
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default function TaskTimeline({ tasks, onOpen }: TaskTimelineProps) {
  const dated = tasks.filter((t) => t.startDate || t.dueDate);
  const undated = tasks.filter((t) => !t.startDate && !t.dueDate);

  if (dated.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12 text-sm">
        No tasks have a start or due date yet — add one from a task's details to see it on the timeline.
      </p>
    );
  }

  const times = dated.flatMap((t) => [
    t.startDate ? new Date(t.startDate).getTime() : null,
    t.dueDate ? new Date(t.dueDate).getTime() : null,
  ].filter((n): n is number => n !== null));

  const minTime = Math.min(...times) - DAY_MS;
  const maxTime = Math.max(...times) + DAY_MS;
  const totalSpan = Math.max(maxTime - minTime, DAY_MS);

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-400 mb-2 px-1">
        <span>{formatDate(new Date(minTime + DAY_MS))}</span>
        <span>{formatDate(new Date(maxTime - DAY_MS))}</span>
      </div>

      <div className="overflow-x-auto">
        <div className="space-y-2 min-w-[480px]">
          {dated.map((task) => {
            const startTime = task.startDate ? new Date(task.startDate).getTime() : new Date(task.dueDate!).getTime();
            const endTime = task.dueDate ? new Date(task.dueDate).getTime() : startTime;
            const left = ((startTime - minTime) / totalSpan) * 100;
            const width = Math.max(((endTime - startTime) / totalSpan) * 100, 2);

            return (
              <div key={task.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpen(task.id)}
                  className="w-32 sm:w-40 shrink-0 text-left text-xs font-medium text-[#333333] truncate hover:text-[#458B9E] transition-colors"
                >
                  {task.title}
                </button>
                <div className="relative flex-1 h-6 bg-gray-50 rounded-md">
                  <button
                    type="button"
                    onClick={() => onOpen(task.id)}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    className={`absolute top-0.5 bottom-0.5 rounded ${STATUS_BAR_COLOR[task.status]} hover:opacity-80 transition-opacity`}
                    aria-label={`${task.title}, ${task.status}`}
                  />
                </div>
                {task.blockedBy.length > 0 && (
                  <span className="hidden sm:flex items-center gap-1 text-[11px] text-amber-700 shrink-0" title={task.blockedBy.map((d) => d.dependsOn.title).join(', ')}>
                    <Link2 className="w-3 h-3" />
                    {task.blockedBy.length}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {undated.length > 0 && (
        <p className="text-xs text-gray-400 mt-4">
          {undated.length} task{undated.length === 1 ? '' : 's'} without dates not shown — set a start or due date to add {undated.length === 1 ? 'it' : 'them'} to the timeline.
        </p>
      )}
    </div>
  );
}
