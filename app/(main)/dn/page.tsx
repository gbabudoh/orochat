import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDirectNoteThreads } from '@/features/dn/actions';
import DirectNoteThreadList from '@/components/feature/DN/DirectNoteThreadList';
import DNHeaderGuide from '@/components/feature/DN/DNHeaderGuide';
import { Mail } from 'lucide-react';

export default async function DirectNotesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const threads = await getDirectNoteThreads(session.user.id);

  return (
    <div className="max-w-4xl mx-auto w-full min-w-0 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 shadow-2xs">
              <Mail className="w-5 h-5 text-[#458B9E]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Direct Notes</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Notes from Oros you haven&apos;t connected with yet — separate from Collab.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <DNHeaderGuide />
        </div>
      </div>

      {/* Threads Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-2.5 sm:p-6 transition-all">
        <DirectNoteThreadList threads={threads} />
      </div>
    </div>
  );
}
