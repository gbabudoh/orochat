import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import ConsultsHeaderGuide from '@/components/feature/Connections/ConsultsHeaderGuide';
import ConsultsClient from '@/components/feature/Connections/ConsultsClient';
import HelpTooltip from '@/components/ui/HelpTooltip';

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
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6 space-y-3">
        <Link
          href="/oro"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#458B9E] hover:text-[#3a7585] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Oros
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#333333]">Find a Consult</h1>
              <HelpTooltip
                title="Video Consultations Guide"
                description="Book 1-on-1 scheduled video call sessions with verified Orochat industry experts."
                tips={[
                  'Inspect consultation topics and fixed session rates ($/consult).',
                  'Click Book Consult to view available time slots on their profile.',
                  'Use the search box to find consults by name, company, or topic.',
                  'To offer consults yourself, enable consultation settings on your profile.',
                ]}
              />
            </div>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
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
