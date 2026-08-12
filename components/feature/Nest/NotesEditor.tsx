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
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Shared Notes</h2>
          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-200/80 text-slate-700">
            {notes.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setHasDraft(true)}
          disabled={hasDraft}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-white/90 shrink-0" />
          <span>Add Note</span>
        </button>
      </div>

      {deleteError && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200/80 text-xs font-semibold">
          {deleteError}
        </div>
      )}

      {hasDraft && (
        <NoteEntry
          note={{ id: null, content: '', updatedAt: null, updatedByName: null }}
          startInEditMode
          onSave={handleSaveDraft}
          onCancelDraft={() => setHasDraft(false)}
        />
      )}

      {notes.length === 0 && !hasDraft ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center my-2 shadow-2xs">
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
            No notes yet — click &quot;Add Note&quot; to collaborate on shared docs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteEntry
              key={note.id}
              note={note}
              startInEditMode={false}
              onSave={(content) => handleSaveExisting(note.id as string, content)}
              onDelete={() => handleDelete(note.id as string)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
