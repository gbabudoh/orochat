import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MainHeader from '@/components/layout/MainHeader';
import MainSidebar from '@/components/layout/MainSidebar';

export default async function OroProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Public layout - show header/sidebar only if authenticated
  return (
    <div className="min-h-screen bg-[#F0F3F7]">
      {session && <MainHeader />}
      <div className="flex">
        {session && <MainSidebar />}
        <main className={`flex-1 ${session ? 'lg:ml-64 mt-16' : ''} p-0`}>
          {children}
        </main>
      </div>
    </div>
  );
}

