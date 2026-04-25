import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MainHeader from '@/components/layout/MainHeader';
import MainSidebar from '@/components/layout/MainSidebar';

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
        <main className="flex-1 lg:ml-64 mt-16 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

