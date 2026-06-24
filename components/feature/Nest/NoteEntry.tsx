'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Pencil, Check, Trash2 } from 'lucide-react';
import { formatPostDateTime } from '@/lib/utils/formatters';
import Button from '@/components/ui/Button';

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
      className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-[#458B9E] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className={`flex gap-2 p-2 border-b border-gray-200 ${isEditing ? 'flex-col sm:flex-row sm:items-center sm:justify-between' : 'items-center justify-between'}`}>
        {isEditing ? (
          <div className="flex items-center gap-1 flex-wrap">
            {toolbarButton('Bold', <Bold className="w-4 h-4" />, editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
            {toolbarButton('Italic', <Italic className="w-4 h-4" />, editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
            {toolbarButton('Heading 1', <Heading1 className="w-4 h-4" />, editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
            {toolbarButton('Heading 2', <Heading2 className="w-4 h-4" />, editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
            {toolbarButton('Bullet list', <List className="w-4 h-4" />, editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
            {toolbarButton('Numbered list', <ListOrdered className="w-4 h-4" />, editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run())}
          </div>
        ) : (
          <span className="text-xs text-gray-500 pl-2">
            {note.updatedByName && note.updatedAt
              ? `Last updated by ${note.updatedByName} — ${formatPostDateTime(note.updatedAt)}`
              : ''}
          </span>
        )}

        <div className={`flex items-center gap-1.5 ${isEditing ? 'self-end sm:self-auto shrink-0' : ''}`}>
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={!note.id && onCancelDraft ? onCancelDraft : handleCancelEdit}
                className="whitespace-nowrap"
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving} className="whitespace-nowrap">
                <Check className="w-4 h-4 mr-1.5" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={handleEdit}>
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {saveError && (
        <p className="text-xs text-red-500 px-4 pt-2">{saveError}</p>
      )}
      <EditorContent
        editor={editor}
        className="nest-notes-content px-4 py-3 min-h-[120px] text-sm text-[#333333] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]"
      />
    </div>
  );
}
