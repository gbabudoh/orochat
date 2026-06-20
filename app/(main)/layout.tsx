import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MainHeader from '@/components/layout/MainHeader';
import MainSidebar from '@/components/layout/MainSidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Note: oro/[id] pages handle their own public access
  // Other routes require authentication
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#F0F3F7]">
      <MainHeader />
      <div className="flex">
        <MainSidebar />
        <main className="flex-1 w-full min-w-0 lg:ml-64 mt-16 p-3 sm:p-6 pb-24 lg:pb-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

