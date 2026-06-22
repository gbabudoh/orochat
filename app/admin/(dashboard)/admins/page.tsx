import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth.admin';
import Card from '@/components/ui/Card';
import CreateAdminForm from '@/components/admin/CreateAdminForm';

export default async function AdminAdminsPage() {
  const session = await getAdminSession();
  if (session?.user.role !== 'SUPER_ADMIN') redirect('/admin');

  const admins = await db.adminUser.findMany({ orderBy: { createdAt: 'asc' } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Admins</h1>

      <Card className="max-w-2xl mb-6">
        <h2 className="font-semibold text-[#333333] mb-3">Create Admin</h2>
        <CreateAdminForm />
      </Card>

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-4 py-3 font-medium text-[#333333]">{admin.name}</td>
                <td className="px-4 py-3 text-gray-500">{admin.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      admin.role === 'SUPER_ADMIN' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(admin.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
