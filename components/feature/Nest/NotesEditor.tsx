'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import NoteEntry, { type NoteEntryData } from '@/components/feature/Nest/NoteEntry';
import { getNotes, createNoteEntry, updateNoteEntry, deleteNoteEntry } from '@/features/nest/actions';

interface NotesEditorProps {
  nestId: string;
  currentUserId: string;
}

export default function NotesEditor({ nestId, currentUserId }: NotesEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<NoteEntryData[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    getNotes(nestId, currentUserId).then((result) => {
      if (result.success && result.notes) setNotes(result.notes);
      setIsLoading(false);
    });
  }, [nestId, currentUserId]);

  const handleSaveDraft = async (content: string): Promise<boolean> => {
    const result = await createNoteEntry(nestId, currentUserId, content);
    if (result.success) {
      setNotes((prev) => [
        { id: result.id ?? null, content, updatedAt: result.updatedAt ?? null, updatedByName: result.updatedByName ?? null },
        ...prev,
      ]);
      setHasDraft(false);
      return true;
    }
    return false;
  };

  const handleSaveExisting = async (noteId: string, content: string): Promise<boolean> => {
    const result = await updateNoteEntry(noteId, currentUserId, content);
    if (result.success) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, content, updatedAt: result.updatedAt ?? null, updatedByName: result.updatedByName ?? null }
            : n
        )
      );
      return true;
    }
    return false;
  };

  const handleDelete = async (noteId: string) => {
    setDeleteError('');
    const result = await deleteNoteEntry(noteId, currentUserId);
    if (result.success) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } else {
      setDeleteError(result.error || 'Failed to delete note — please try again.');
    }
  };

  if (isLoading) {
    return <p className="text-center text-gray-500 py-12">Loading notes…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
        <Button size="sm" onClick={() => setHasDraft(true)} disabled={hasDraft} className="ml-auto">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Note
        </Button>
      </div>

      {hasDraft && (
        <NoteEntry
          note={{ id: null, content: '', updatedAt: null, updatedByName: null }}
          startInEditMode
          onSave={handleSaveDraft}
          onCancelDraft={() => setHasDraft(false)}
        />
      )}

      {notes.length === 0 && !hasDraft ? (
        <p className="text-center text-gray-500 py-12">No notes yet — click &quot;Add Note&quot; to start one.</p>
      ) : (
        notes.map((note, index) => (
          <div key={note.id}>
            <NoteEntry
              note={note}
              startInEditMode={false}
              onSave={(content) => handleSaveExisting(note.id as string, content)}
              onDelete={() => handleDelete(note.id as string)}
            />
            {index < notes.length - 1 && <hr className="my-4 border-gray-200" />}
          </div>
        ))
      )}
    </div>
  );
}
