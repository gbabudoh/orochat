import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth.admin';
import AdminNav from '@/components/admin/AdminNav';
import { Toaster } from 'sonner';

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="min-h-screen flex bg-[#F0F3F7]">
      <Toaster richColors position="top-right" />
      <AdminNav role={session.user.role ?? 'ADMIN'} />
      <main className="flex-1 min-w-0 p-6 sm:p-8">{children}</main>
    </div>
  );
}
