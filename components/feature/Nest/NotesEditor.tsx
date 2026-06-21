'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import { getNote, updateNote } from '@/features/nest/actions';

const AUTOSAVE_DELAY_MS = 1000;

interface NotesEditorProps {
  nestId: string;
  currentUserId: string;
}

export default function NotesEditor({ nestId, currentUserId }: NotesEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: '',
    onUpdate: ({ editor }) => {
      setSaveState('saving');
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        await updateNote(nestId, currentUserId, editor.getHTML());
        setSaveState('saved');
      }, AUTOSAVE_DELAY_MS);
    },
  });

  useEffect(() => {
    if (!editor) return;
    getNote(nestId, currentUserId).then((result) => {
      if (result.success) {
        editor.commands.setContent(result.content || '');
      }
      setIsLoading(false);
    });
  }, [editor, nestId, currentUserId]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  if (!editor || isLoading) {
    return <p className="text-center text-gray-500 py-12">Loading notes…</p>;
  }

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
      <div className="flex items-center justify-between gap-2 p-2 border-b border-gray-200">
        <div className="flex items-center gap-1">
          {toolbarButton('Bold', <Bold className="w-4 h-4" />, editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
          {toolbarButton('Italic', <Italic className="w-4 h-4" />, editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
          {toolbarButton('Heading 1', <Heading1 className="w-4 h-4" />, editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
          {toolbarButton('Heading 2', <Heading2 className="w-4 h-4" />, editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
          {toolbarButton('Bullet list', <List className="w-4 h-4" />, editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
          {toolbarButton('Numbered list', <ListOrdered className="w-4 h-4" />, editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run())}
        </div>
        <span className="text-xs text-gray-400 pr-2">
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}
        </span>
      </div>
      <EditorContent
        editor={editor}
        className="nest-notes-content px-4 py-3 min-h-[300px] text-sm text-[#333333] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px]"
      />
    </div>
  );
}
