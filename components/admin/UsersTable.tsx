'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import UserRowActions from './UserRowActions';
import FraudFlagResolve from './FraudFlagResolve';
import SortableHeader from './SortableHeader';
import { bulkSetUserPaused } from '@/features/admin/user-actions';

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
}

export default function UsersTable({ users, currentSort, currentDir, searchParams }: Props) {
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
    toast.success(isPaused ? 'Selected users paused' : 'Selected users reactivated');
    setSelected(new Set());
    router.refresh();
  };

  const headerProps = { currentSort, currentDir, searchParams };

  return (
    <Card padding="none" className="overflow-hidden">
      {selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#458B9E]/5 border-b border-gray-200">
          <span className="text-sm text-gray-600">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => runBulk(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
            >
              Pause selected
            </button>
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => runBulk(false)}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60 transition-colors"
            >
              Reactivate selected
            </button>
          </div>
        </div>
      )}
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-3 w-8">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4" aria-label="Select all" />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortableHeader label="User" sortKey="name" {...headerProps} />
            </th>
            <th className="px-4 py-3 font-medium">Partner</th>
            <th className="px-4 py-3 font-medium">
              <SortableHeader label="TES" sortKey="tes" {...headerProps} />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortableHeader label="Oros" sortKey="oros" {...headerProps} />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortableHeader label="Communities" sortKey="communities" {...headerProps} />
            </th>
            <th className="px-4 py-3 font-medium">Fraud flags</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(user.id)}
                  onChange={() => toggle(user.id)}
                  className="w-4 h-4"
                  aria-label={`Select ${user.name}`}
                />
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-[#333333]">{user.name}</p>
                <p className="text-gray-500 text-xs">{user.email}</p>
              </td>
              <td className="px-4 py-3">{user.isPartner ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3">{user.currentTES.toFixed(1)}</td>
              <td className="px-4 py-3">{user.verifiedOrosCount}</td>
              <td className="px-4 py-3">{user.compassMembershipsCount}</td>
              <td className="px-4 py-3">
                {user.fraudFlags.length === 0 ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  <ul className="space-y-1">
                    {user.fraudFlags.map((flag) => (
                      <li key={flag.id} className="flex items-center gap-2">
                        <span className="text-red-600 text-xs">{flag.reason}</span>
                        <FraudFlagResolve flagId={flag.id} />
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="px-4 py-3">
                <UserRowActions userId={user.id} isPaused={user.isPaused} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p className="text-center text-gray-500 py-12">No users found</p>}
    </Card>
  );
}
