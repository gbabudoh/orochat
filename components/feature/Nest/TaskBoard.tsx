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
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'kanban' ? 'bg-white text-[#458B9E] shadow-xs' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            Board
          </button>
          <button
            type="button"
            onClick={() => setView('timeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'timeline' ? 'bg-white text-[#458B9E] shadow-xs' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GanttChart className="w-3.5 h-3.5" />
            Timeline
          </button>
        </div>
        <Button size="sm" onClick={() => setIsNewTaskOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Task
        </Button>
      </div>

      {view === 'kanban' ? (
        <div className="grid md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-semibold text-[#333333]">{col.label}</h3>
                  <span className="text-xs text-gray-400">{columnTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-[60px]">
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
                    <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
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
