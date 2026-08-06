'use client';

import { useEffect, useState } from 'react';
import { X, Link2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { updateTask, addTaskDependency, removeTaskDependency } from '@/features/nest/actions';
import type { NestTaskItem } from '@/components/feature/Nest/TaskCard';

interface Member {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: NestTaskItem;
  nestId: string;
  currentUserId: string;
  members: Member[];
  allTasks: NestTaskItem[];
  onUpdated: (task: NestTaskItem) => void;
  onDependencyChange: () => void;
}

function toDateInputValue(value: Date | string | null): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  currentUserId,
  members,
  allTasks,
  onUpdated,
  onDependencyChange,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? '');
  const [startDate, setStartDate] = useState(toDateInputValue(task.startDate));
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [newDependencyId, setNewDependencyId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingDependency, setIsAddingDependency] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setAssigneeId(task.assignee?.id ?? '');
    setStartDate(toDateInputValue(task.startDate));
    setDueDate(toDateInputValue(task.dueDate));
    setNewDependencyId('');
    setError('');
  }, [isOpen, task]);

  const handleSave = async () => {
    setError('');
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    setIsSaving(true);
    try {
      const result = await updateTask(task.id, currentUserId, {
        title,
        description: description || null,
        assigneeId: assigneeId || null,
        startDate: startDate || null,
        dueDate: dueDate || null,
      });
      if (result.success && result.task) {
        onUpdated(result.task as NestTaskItem);
        onClose();
      } else {
        setError(result.error || 'Failed to save task');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDependency = async () => {
    if (!newDependencyId) return;
    setIsAddingDependency(true);
    setError('');
    try {
      const result = await addTaskDependency(task.id, newDependencyId, currentUserId);
      if (result.success) {
        setNewDependencyId('');
        onDependencyChange();
      } else {
        setError(result.error || 'Failed to add dependency');
      }
    } finally {
      setIsAddingDependency(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    const result = await removeTaskDependency(dependencyId, currentUserId);
    if (result.success) {
      onDependencyChange();
    } else {
      setError(result.error || 'Failed to remove dependency');
    }
  };

  const linkedIds = new Set(task.blockedBy.map((d) => d.dependsOn.id));
  const dependencyOptions = allTasks.filter((t) => t.id !== task.id && !linkedIds.has(t.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" size="md">
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

      <div className="mt-4">
        <label className="block text-sm font-medium text-[#333333] mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more detail…"
          className="w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 bg-white text-[#333333] placeholder:text-gray-400 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 min-h-[80px]"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-[#333333] mb-1.5">Assignee</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 bg-white text-[#333333] border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100">
        <label className="flex items-center gap-1.5 text-sm font-medium text-[#333333] mb-2">
          <Link2 className="w-4 h-4 text-[#458B9E]" />
          Blocked by
        </label>

        {task.blockedBy.length > 0 && (
          <ul className="space-y-1.5 mb-3">
            {task.blockedBy.map((dep) => (
              <li
                key={dep.id}
                className="flex items-center justify-between gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-1.5"
              >
                <span className="truncate">{dep.dependsOn.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDependency(dep.id)}
                  className="text-amber-600 hover:text-amber-900 shrink-0"
                  aria-label={`Remove dependency on ${dep.dependsOn.title}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {dependencyOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={newDependencyId}
              onChange={(e) => setNewDependencyId(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border-2 border-gray-200 bg-white text-[#333333] focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20"
            >
              <option value="">Select a task…</option>
              {dependencyOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddDependency}
              isLoading={isAddingDependency}
              disabled={!newDependencyId}
            >
              Add
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} isLoading={isSaving}>
          Save Changes
        </Button>
      </div>
    </Modal>
  );
}
