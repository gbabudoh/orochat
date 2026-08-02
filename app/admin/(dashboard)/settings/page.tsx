import { getPlatformConfig } from '@/lib/platformConfig';
import { getAdminSession } from '@/lib/auth.admin';
import PlatformSplitForm from '@/components/admin/PlatformSplitForm';
import {
  ShieldCheck,
  DollarSign,
  Lock,
  Sliders,
  Database,
  Server,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Users,
  Compass,
  FileText,
} from 'lucide-react';

export default async function AdminSettingsPage() {
  const [config, session] = await Promise.all([getPlatformConfig(), getAdminSession()]);
  const isSuperAdmin = session?.user.role === 'SUPER_ADMIN';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings & Config</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure revenue share ratios, security access controls, and platform policy thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Role: {session?.user.role || 'ADMIN'}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Ad Revenue Split & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Revenue Share Split */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-base">Ad Revenue Split Configuration</h2>
                  <p className="text-xs text-gray-500">
                    Gross ad revenue percentage allocated into the monthly Oro Partner distribution pool.
                  </p>
                </div>
              </div>
            </div>

            {isSuperAdmin ? (
              <PlatformSplitForm oroSharePercent={config.oroSharePercent} />
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Super Admin Privilege Required</span>
                </div>
                <p>
                  Current Split: <strong>{(config.oroSharePercent * 100).toFixed(0)}% Oros</strong> /{' '}
                  <strong>{((1 - config.oroSharePercent) * 100).toFixed(0)}% Orochat Platform</strong>.
                </p>
                <p className="text-amber-700/80">Only Super Admins can adjust the ad revenue distribution ratio.</p>
              </div>
            )}
          </div>

          {/* Card 2: Security & Access Control */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">Security & Admin Access Policy</h2>
                <p className="text-xs text-gray-500">
                  Authentication rules, audit trails, and role-based permissions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Isolated Admin Auth</span>
                </div>
                <p className="text-gray-500 leading-relaxed">
                  Admin sessions are completely isolated from standard user cookies.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Immutable Audit Logs</span>
                </div>
                <p className="text-gray-500 leading-relaxed">
                  All administrative updates are permanently recorded with IP and admin ID timestamps.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Partner Criteria & Infrastructure */}
        <div className="space-y-6">
          {/* Card 3: Partner Qualification Criteria */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#458B9E]" />
                <h3 className="font-bold text-gray-900 text-base">Partner Criteria</h3>
              </div>
              <p className="text-xs text-gray-500">Milestones required for Oro Partner status</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-800">Verified Oros Target</span>
                </div>
                <span className="font-bold text-gray-900">1,000</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-gray-800">Compass Target</span>
                </div>
                <span className="font-bold text-gray-900">10 Communities</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800">
                <p className="font-semibold text-emerald-900">Ad Revenue Share Qualified</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Partners receive automatic monthly distributions via Stripe Connect.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Cloud & Service Infrastructure */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Infrastructure Status</h3>
              <p className="text-xs text-gray-500">Active services & integrations</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-800">PostgreSQL DB</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-800">Stripe Express</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-gray-800">MinIO S3 Storage</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
