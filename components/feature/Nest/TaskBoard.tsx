'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, ListChecks, GanttChart } from 'lucide-react';
import Button from '@/components/ui/Button';
import TaskCard, { type NestTaskItem, type NestTaskStatus } from '@/components/feature/Nest/TaskCard';
import NewTaskModal from '@/components/feature/Nest/NewTaskModal';
import TaskDetailModal from '@/components/feature/Nest/TaskDetailModal';
import TaskTimeline from '@/components/feature/Nest/TaskTimeline';
import { getTasks, updateTaskStatus, deleteTask } from '@/features/nest/actions';

interface Member {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
}

interface TaskBoardProps {
  nestId: string;
  currentUserId: string;
  members: Member[];
}

const COLUMNS: { status: NestTaskStatus; label: string }[] = [
  { status: 'TODO', label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'DONE', label: 'Done' },
];

type View = 'kanban' | 'timeline';

export default function TaskBoard({ nestId, currentUserId, members }: TaskBoardProps) {
  const [tasks, setTasks] = useState<NestTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [view, setView] = useState<View>('kanban');

  const refetchTasks = useCallback(async () => {
    const result = await getTasks(nestId, currentUserId);
    if (Array.isArray(result)) setTasks(result as NestTaskItem[]);
  }, [nestId, currentUserId]);

  useEffect(() => {
    let active = true;
    getTasks(nestId, currentUserId).then((result) => {
      if (active && Array.isArray(result)) {
        setTasks(result as NestTaskItem[]);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [nestId, currentUserId]);

  const handleStatusChange = async (taskId: string, status: NestTaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    await updateTaskStatus(taskId, currentUserId, status);
  };

  const handleDelete = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId(null);
    await deleteTask(taskId, currentUserId);
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  if (isLoading) {
    return <p className="text-center text-gray-500 py-12">Loading tasks…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shadow-2xs inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              view === 'kanban'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ListChecks className={`w-3.5 h-3.5 ${view === 'kanban' ? 'text-[#458B9E]' : 'text-slate-500'}`} />
            <span>Board</span>
          </button>
          <button
            type="button"
            onClick={() => setView('timeline')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              view === 'timeline'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <GanttChart className={`w-3.5 h-3.5 ${view === 'timeline' ? 'text-[#458B9E]' : 'text-slate-500'}`} />
            <span>Timeline</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsNewTaskOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-white/90 shrink-0" />
          <span>Add Task</span>
        </button>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{col.label}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-200/80 text-slate-700">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onOpen={setSelectedTaskId}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <p className="text-xs text-slate-400 font-medium text-center py-6 border border-dashed border-slate-200 rounded-xl bg-white/50">
                      No tasks
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <TaskTimeline tasks={tasks} onOpen={setSelectedTaskId} />
      )}

      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        nestId={nestId}
        currentUserId={currentUserId}
        members={members}
        onCreated={(task) => setTasks((prev) => [...prev, task])}
      />

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTaskId(null)}
          task={selectedTask}
          nestId={nestId}
          currentUserId={currentUserId}
          members={members}
          allTasks={tasks}
          onUpdated={(updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
          onDependencyChange={refetchTasks}
        />
      )}
    </div>
  );
}
