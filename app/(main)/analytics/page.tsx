import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getProfileViewStats } from '@/lib/profileViews';
import ProfileViewAnalytics from '@/components/feature/Profile/ProfileViewAnalytics';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const stats = await getProfileViewStats(session.user.id);

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-0">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-1 md:mb-2">Analytics</h1>
        <p className="text-sm sm:text-base text-gray-600">Track views and engagement on your profile</p>
      </div>

      <div className="space-y-6">
        <ProfileViewAnalytics stats={stats} />
      </div>
    </div>
  );
}
