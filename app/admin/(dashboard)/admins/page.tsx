import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth.admin';
import AdminsTableClient from '@/components/admin/AdminsTableClient';
import { ShieldCheck, Sparkles, Shield, KeyRound, Lock } from 'lucide-react';

export default async function AdminAdminsPage() {
  const session = await getAdminSession();
  if (session?.user.role !== 'SUPER_ADMIN') redirect('/admin');

  // Parallel DB queries
  const [admins, totalAdmins, superAdminsCount] = await Promise.all([
    db.adminUser.findMany({ orderBy: { createdAt: 'asc' } }),
    db.adminUser.count(),
    db.adminUser.count({ where: { role: 'SUPER_ADMIN' } }),
  ]);

  const standardAdminsCount = totalAdmins - superAdminsCount;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Access & Security</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage administrative accounts, role authorization levels, and platform access policies.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
          <Lock className="w-4 h-4 text-purple-600" />
          <span>Super Admin Access</span>
        </div>
      </div>

      {/* Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Admins */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Admins</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalAdmins.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">Authorized accounts</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Super Admins */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Super Admins</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{superAdminsCount.toLocaleString()}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Full system privilege</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Standard Admins */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Standard Admins</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{standardAdminsCount.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">Restricted access level</p>
          </div>
          <div className="p-3 rounded-2xl bg-gray-100 text-gray-600">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        {/* Security Policy Status */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Security Policy</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">Encrypted</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Bcrypt & Audit Enabled</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <KeyRound className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Admins Table Client */}
      <AdminsTableClient admins={admins} />
    </div>
  );
}
