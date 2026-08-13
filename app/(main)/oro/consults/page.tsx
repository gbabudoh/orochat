import Link from 'next/link';
import { ArrowLeft, Video } from 'lucide-react';
import { db } from '@/lib/db';
import ConsultsHeaderGuide from '@/components/feature/Connections/ConsultsHeaderGuide';
import ConsultsClient from '@/components/feature/Connections/ConsultsClient';

export default async function ConsultsDirectoryPage() {
  const oros = await db.user.findMany({
    where: { consultEnabled: true, isPaused: false },
    select: {
      id: true,
      name: true,
      avatar: true,
      title: true,
      company: true,
      consultTopic: true,
      consultPriceCents: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-2.5 sm:px-6 py-4 sm:py-6 space-y-6">
      <div className="space-y-4">
        <div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all shrink-0 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 text-[#458B9E]" />
            <span>Back to Explore</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 shrink-0">
                <Video className="w-5 h-5 text-[#458B9E]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Find a Consult</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Oros currently offering paid, scheduled video consults
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <ConsultsHeaderGuide />
          </div>
        </div>
      </div>

      <ConsultsClient oros={oros} />
    </div>
  );
}
