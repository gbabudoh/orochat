import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getProfileViewStats } from '@/lib/profileViews';
import ProfileViewAnalytics from '@/components/feature/Profile/ProfileViewAnalytics';
import AnalyticsHeaderGuide from '@/components/feature/Analytics/AnalyticsHeaderGuide';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { BarChart3 } from 'lucide-react';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const stats = await getProfileViewStats(session.user.id);

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-2.5 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 shrink-0">
              <BarChart3 className="w-5 h-5 text-[#458B9E]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Profile Analytics</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Track views, country demographics, and engagement on your profile.
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <AnalyticsHeaderGuide />
        </div>
      </div>

      <div className="space-y-6">
        <ProfileViewAnalytics stats={stats} />
      </div>
    </div>
  );
}
