'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createTask } from '@/features/nest/actions';
import type { NestTaskItem } from '@/components/feature/Nest/TaskCard';

interface Member {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
}

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  nestId: string;
  currentUserId: string;
  members: Member[];
  onCreated: (task: NestTaskItem) => void;
}

export default function NewTaskModal({ isOpen, onClose, nestId, currentUserId, members, onCreated }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setDueDate('');
    setError('');
  }, [isOpen]);

  const handleCreate = async () => {
    setError('');
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTask(nestId, currentUserId, {
        title,
        description: description || undefined,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      });
      if (result.success && result.task) {
        onCreated(result.task as NestTaskItem);
        onClose();
      } else {
        setError(result.error || 'Failed to create task');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Task">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Draft the proposal"
      />

      <div className="mt-4">
        <label className="block text-sm font-medium text-[#333333] mb-1.5">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more detail…"
          className="w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 bg-white text-[#333333] placeholder:text-gray-400 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 min-h-[80px]"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
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
        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleCreate} isLoading={isSubmitting}>
          Add Task
        </Button>
      </div>
    </Modal>
  );
}
