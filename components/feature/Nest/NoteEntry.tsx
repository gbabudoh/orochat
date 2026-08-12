'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Pencil, Check, Trash2 } from 'lucide-react';
import { formatPostDateTime } from '@/lib/utils/formatters';

export interface NoteEntryData {
  id: string | null; // null = unsaved draft
  content: string;
  updatedAt: Date | string | null;
  updatedByName: string | null;
}

interface NoteEntryProps {
  note: NoteEntryData;
  startInEditMode: boolean;
  onSave: (content: string) => Promise<boolean>;
  onDelete?: () => void;
  onCancelDraft?: () => void;
}

export default function NoteEntry({ note, startInEditMode, onSave, onDelete, onCancelDraft }: NoteEntryProps) {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: note.content,
    editable: startInEditMode,
  });

  if (!editor) return null;

  const handleEdit = () => {
    editor.setEditable(true);
    editor.commands.focus('end');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    editor.commands.setContent(note.content);
    editor.setEditable(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const succeeded = await onSave(editor.getHTML());
      if (succeeded) {
        editor.setEditable(false);
        setIsEditing(false);
      } else {
        setSaveError('Failed to save — your text is still here, please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toolbarButton = (
    label: string,
    icon: React.ReactNode,
    isActive: boolean,
    onClick: () => void
  ) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer select-none ${
        isActive
          ? 'bg-[#458B9E] text-white shadow-2xs'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all hover:border-slate-300">
      <div
        className={`flex gap-2 px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 ${
          isEditing ? 'flex-col sm:flex-row sm:items-center sm:justify-between' : 'items-center justify-between'
        }`}
      >
        {isEditing ? (
          <div className="flex items-center gap-1 flex-wrap">
            {toolbarButton('Bold', <Bold className="w-3.5 h-3.5" />, editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
            {toolbarButton('Italic', <Italic className="w-3.5 h-3.5" />, editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
            {toolbarButton('Heading 1', <Heading1 className="w-3.5 h-3.5" />, editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
            {toolbarButton('Heading 2', <Heading2 className="w-3.5 h-3.5" />, editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
            {toolbarButton('Bullet list', <List className="w-3.5 h-3.5" />, editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
            {toolbarButton('Numbered list', <ListOrdered className="w-3.5 h-3.5" />, editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run())}
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {note.updatedByName && (
              <span className="text-xs font-bold text-slate-800 truncate">{note.updatedByName}</span>
            )}
            {note.updatedByName && note.updatedAt && <span className="text-slate-300">•</span>}
            {note.updatedAt && (
              <span className="text-xs text-slate-500 font-semibold shrink-0">
                {formatPostDateTime(note.updatedAt)}
              </span>
            )}
          </div>
        )}

        <div className={`flex items-center gap-1.5 ${isEditing ? 'self-end sm:self-auto shrink-0' : ''}`}>
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={!note.id && onCancelDraft ? onCancelDraft : handleCancelEdit}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5 text-white/90" />
                <span>Save</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#458B9E] bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                  aria-label="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {saveError && (
        <p className="text-xs text-red-500 font-semibold px-4 pt-2">{saveError}</p>
      )}
      <EditorContent
        editor={editor}
        className="nest-notes-content px-4 py-3.5 min-h-[100px] text-xs sm:text-sm text-slate-800 font-medium [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[80px]"
      />
    </div>
  );
}
