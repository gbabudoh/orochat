'use client';

import Modal from '@/components/ui/Modal';
import {
  FolderGit2,
  Kanban,
  FileText,
  Video,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: FolderGit2,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Project Workspaces',
    description:
      'OroNest provides dedicated project hubs for you and your Oros to manage tasks, notes, and calls together.',
    tips: [
      'Click "+ New OroNest" at the top right to create a new project workspace.',
      'Invite verified connections as project collaborators.',
      'Archived workspaces can be restored or deleted anytime.',
    ],
  },
  {
    icon: Kanban,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    title: '2. Kanban Task Boards',
    description:
      'Organize project deliverables using drag-and-drop task boards with custom status columns.',
    tips: [
      'Track tasks in "To Do", "In Progress", and "Done" columns.',
      'Assign task owners and set due dates.',
      'Task updates synchronize in real-time across collaborators.',
    ],
  },
  {
    icon: FileText,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Shared Notes Editor',
    description:
      'Collaborate on rich-text project documentation, specs, and meeting notes using the Tiptap editor.',
    tips: [
      'Supports headings, checklists, code blocks, and formatted text.',
      'Changes auto-save continuously for all active collaborators.',
    ],
  },
  {
    icon: Video,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Team Chat & Video Calls',
    description:
      'Launch instant team video calls or group messaging threads directly inside your workspace.',
    tips: [
      '1-click video room launcher directly embedded in every OroNest.',
      'Reuses connected group chat threads for persistent messaging.',
    ],
  },
];

export default function NestGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="OroNest Workspace Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to OroNest Workspaces</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to create project workspaces, manage Kanban task boards, write shared notes, and host video calls with your collaborators.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {GUIDE_SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-4 space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${section.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{section.title}</h4>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed pl-1">{section.description}</p>

                <div className="pt-2 border-t border-gray-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-[#458B9E] uppercase tracking-wider block mb-1">
                    Key Instructions:
                  </span>
                  <ul className="space-y-1">
                    {section.tips.map((tip, tIdx) => (
                      <li key={tIdx} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#458B9E] shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#458B9E] hover:bg-[#387383] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </Modal>
  );
}
