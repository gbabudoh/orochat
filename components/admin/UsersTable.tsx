'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import UserRowActions from './UserRowActions';
import FraudFlagResolve from './FraudFlagResolve';
import SortableHeader from './SortableHeader';
import { bulkSetUserPaused } from '@/features/admin/user-actions';
import {
  Award,
  ShieldAlert,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Ban,
  RotateCcw,
  User as UserIcon,
  AlertTriangle
} from 'lucide-react';

interface UserRow {
  id: string;
  name: string;
  email: string;
  isPartner: boolean;
  isPaused: boolean;
  currentTES: number;
  verifiedOrosCount: number;
  compassMembershipsCount: number;
  fraudFlags: { id: string; reason: string; riskScore: number }[];
}

interface Props {
  users: UserRow[];
  currentSort?: string;
  currentDir?: string;
  searchParams: Record<string, string | undefined>;
  canTerminate: boolean;
}

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_BG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
];

function getAvatarColor(id: string) {
  let charSum = 0;
  for (let i = 0; i < id.length; i++) charSum += id.charCodeAt(i);
  return AVATAR_BG_COLORS[charSum % AVATAR_BG_COLORS.length];
}

export default function UsersTable({ users, currentSort, currentDir, searchParams, canTerminate }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = users.length > 0 && users.every((u) => selected.has(u.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(users.map((u) => u.id)));

  const runBulk = async (isPaused: boolean) => {
    setIsBulkLoading(true);
    await bulkSetUserPaused(Array.from(selected), isPaused);
    setIsBulkLoading(false);
    toast.success(isPaused ? 'Selected users suspended' : 'Selected users reactivated');
    setSelected(new Set());
    router.refresh();
  };

  const headerProps = { currentSort, currentDir, searchParams };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
      {/* Floating Bulk Selection Header */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between px-6 py-3 bg-[#458B9E]/10 border-b border-[#458B9E]/20 animate-fade-in">
          <span className="text-sm font-semibold text-[#458B9E] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#458B9E] text-white flex items-center justify-center text-xs font-bold">
              {selected.size}
            </span>
            Users Selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => runBulk(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60 transition-all cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              Suspend Selected
            </button>
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => runBulk(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-60 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reactivate Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 text-[#458B9E] rounded border-gray-300 focus:ring-[#458B9E]"
                  aria-label="Select all users"
                />
              </th>
              <th className="px-5 py-3.5">
                <SortableHeader label="User Account" sortKey="name" {...headerProps} />
              </th>
              <th className="px-5 py-3.5">Partner</th>
              <th className="px-5 py-3.5">
                <SortableHeader label="TES Score" sortKey="tes" {...headerProps} />
              </th>
              <th className="px-5 py-3.5">
                <SortableHeader label="Verified Oros" sortKey="oros" {...headerProps} />
              </th>
              <th className="px-5 py-3.5">
                <SortableHeader label="Communities" sortKey="communities" {...headerProps} />
              </th>
              <th className="px-5 py-3.5">Fraud Risk Flags</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm">
            {users.map((user) => {
              const isChecked = selected.has(user.id);
              const avatarColor = getAvatarColor(user.id);

              return (
                <tr
                  key={user.id}
                  className={`transition-colors ${
                    isChecked ? 'bg-[#458B9E]/5' : user.isPaused ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50/80'
                  }`}
                >
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(user.id)}
                      className="w-4 h-4 text-[#458B9E] rounded border-gray-300 focus:ring-[#458B9E]"
                      aria-label={`Select ${user.name}`}
                    />
                  </td>

                  {/* User Column with Avatar */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${avatarColor}`}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 leading-snug">{user.name}</span>
                          {user.isPaused && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-red-100 text-red-700 border border-red-200">
                              Suspended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Partner Column */}
                  <td className="px-5 py-4">
                    {user.isPartner ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <Award className="w-3 h-3 text-emerald-600" />
                        Partner
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        Standard
                      </span>
                    )}
                  </td>

                  {/* TES Score Column */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                        user.currentTES >= 2.0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : user.currentTES > 0
                          ? 'bg-[#458B9E]/10 text-[#458B9E] border border-[#458B9E]/20'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {user.currentTES.toFixed(1)}
                    </span>
                  </td>

                  {/* Oros Count Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-700 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4 text-[#458B9E]" />
                      <span>{user.verifiedOrosCount}</span>
                    </div>
                  </td>

                  {/* Communities Count Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-700 text-xs font-semibold">
                      <Compass className="w-4 h-4 text-purple-500" />
                      <span>{user.compassMembershipsCount}</span>
                    </div>
                  </td>

                  {/* Fraud Flags Column */}
                  <td className="px-5 py-4">
                    {user.fraudFlags.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Clean
                      </span>
                    ) : (
                      <div className="space-y-1.5">
                        {user.fraudFlags.map((flag) => (
                          <div
                            key={flag.id}
                            className="flex items-center gap-2 bg-red-50 border border-red-200/80 px-2.5 py-1 rounded-lg text-xs text-red-700"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="font-medium truncate max-w-[140px]">{flag.reason}</span>
                            <FraudFlagResolve flagId={flag.id} />
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Row Actions Column */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end">
                      <UserRowActions
                        userId={user.id}
                        userName={user.name}
                        isPaused={user.isPaused}
                        canTerminate={canTerminate}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <UserIcon className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-gray-800 text-sm">No users found</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            No registered users match your search query or filter criteria. Try adjusting your parameters.
          </p>
        </div>
      )}
    </div>
  );
}
