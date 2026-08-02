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
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-2xl bg-[#458B9E]/10">
              <BarChart3 className="w-4 h-4 text-[#458B9E]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Analytics</h1>
            <HelpTooltip
              title="Profile Analytics Guide"
              description="Private monitoring of total profile visits, visitor demographics, and recent activity."
              tips={[
                'Analytics are completely private to your account.',
                'View country percentages and visitor IP locations.',
                'Inspect the last 30 profile visits in the timeline.',
              ]}
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
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
