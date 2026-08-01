import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth.admin';
import { formatDateTime } from '@/lib/utils/formatters';
import { resolvePresence } from '@/lib/presence';
import Card from '@/components/ui/Card';
import UserRowActions from '@/components/admin/UserRowActions';
import FraudFlagResolve from '@/components/admin/FraudFlagResolve';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [session, user] = await Promise.all([
    getAdminSession(),
    db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        title: true,
        company: true,
        location: true,
        bio: true,
        isPartner: true,
        isPaused: true,
        currentTES: true,
        verifiedOrosCount: true,
        compassMembershipsCount: true,
        presenceStatus: true,
        lastSeenAt: true,
        createdAt: true,
        fraudFlags: { where: { resolved: false }, select: { id: true, reason: true, riskScore: true, createdAt: true } },
      },
    }),
  ]);

  if (!user) notFound();

  const canTerminate = session?.user.role === 'SUPER_ADMIN';
  const presence = resolvePresence(user.lastSeenAt, user.presenceStatus);

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#458B9E] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </Link>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-full shrink-0 bg-[#458B9E] flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={`/api/user/${user.id}/avatar`} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-lg font-semibold">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#333333] truncate">{user.name}</h1>
              <p className="text-gray-500 text-sm truncate">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {user.isPartner && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#458B9E]/10 text-[#458B9E]">Partner</span>
                )}
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    user.isPaused ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                  }`}
                >
                  {user.isPaused ? 'Suspended' : 'Active'}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    presence === 'online' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {presence === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <UserRowActions
            userId={user.id}
            userName={user.name}
            isPaused={user.isPaused}
            canTerminate={canTerminate}
            size="md"
            terminateRedirectTo="/admin/users"
          />
        </div>

        {(user.title || user.company || user.location || user.bio) && (
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-sm text-gray-600">
            {(user.title || user.company) && (
              <p>{[user.title, user.company].filter(Boolean).join(' at ')}</p>
            )}
            {user.location && <p>{user.location}</p>}
            {user.bio && <p className="whitespace-pre-wrap">{user.bio}</p>}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card padding="sm">
          <p className="text-xs text-gray-500 mb-1">TES</p>
          <p className="text-xl font-bold text-[#333333]">{user.currentTES.toFixed(1)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500 mb-1">Verified Oros</p>
          <p className="text-xl font-bold text-[#333333]">{user.verifiedOrosCount}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500 mb-1">Communities</p>
          <p className="text-xl font-bold text-[#333333]">{user.compassMembershipsCount}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500 mb-1">Member since</p>
          <p className="text-sm font-semibold text-[#333333] mt-1.5">{formatDateTime(user.createdAt)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-[#333333] mb-3">Open fraud flags</h2>
        {user.fraudFlags.length === 0 ? (
          <p className="text-sm text-gray-400">No open fraud flags</p>
        ) : (
          <ul className="space-y-2">
            {user.fraudFlags.map((flag) => (
              <li key={flag.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <span className="text-red-600">{flag.reason}</span>
                  <span className="text-gray-400 ml-2">risk {flag.riskScore.toFixed(0)} · {formatDateTime(flag.createdAt)}</span>
                </div>
                <FraudFlagResolve flagId={flag.id} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
