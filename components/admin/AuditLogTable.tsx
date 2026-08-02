'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  MessageSquare,
  Plus,
  Pencil,
  Zap,
  Ban,
  RotateCcw,
  Trash2,
  ScrollText,
  Copy,
  Check,
  User as UserIcon,
  Megaphone,
  Compass as CompassIcon,
  Shield,
  Clock,
  Info
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  adminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: any;
  createdAt: Date | string;
  admin: {
    name: string;
    email: string;
  };
}

interface Props {
  logs: AuditLogItem[];
}

function getInitials(name: string) {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelativeTime(dateInput: Date | string) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getActionBadge(action: string) {
  switch (action) {
    case 'user.message':
      return {
        label: 'Direct Message',
        icon: MessageSquare,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'user.pause':
      return {
        label: 'User Suspended',
        icon: Ban,
        className: 'bg-[#458B9E]/10 text-[#458B9E] border-[#458B9E]/20',
      };
    case 'user.reactivate':
      return {
        label: 'User Reactivated',
        icon: RotateCcw,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'user.terminate':
      return {
        label: 'User Terminated',
        icon: Trash2,
        className: 'bg-red-50 text-red-700 border-red-200',
      };
    case 'campaign.create':
      return {
        label: 'Campaign Created',
        icon: Plus,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'campaign.update':
      return {
        label: 'Campaign Edited',
        icon: Pencil,
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    case 'campaign.status_change':
    case 'campaign.bulk_status_change':
      return {
        label: 'Status Updated',
        icon: Zap,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    default: {
      const formatted = action.replace('.', ' ').replace('_', ' ');
      return {
        label: formatted.charAt(0).toUpperCase() + formatted.slice(1),
        icon: ScrollText,
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      };
    }
  }
}

function getTargetIcon(targetType?: string | null) {
  if (!targetType) return Shield;
  const lower = targetType.toLowerCase();
  if (lower.includes('user')) return UserIcon;
  if (lower.includes('campaign') || lower.includes('ad')) return Megaphone;
  if (lower.includes('compass')) return CompassIcon;
  return Shield;
}

export default function AuditLogTable({ logs }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Admin Operator</th>
              <th className="px-5 py-3.5">Action Executed</th>
              <th className="px-5 py-3.5">Target Entity</th>
              <th className="px-5 py-3.5">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {logs.map((log) => {
              const actionBadge = getActionBadge(log.action);
              const ActionIcon = actionBadge.icon;
              const TargetIcon = getTargetIcon(log.targetType);
              const relTime = formatRelativeTime(log.createdAt);

              return (
                <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                  {/* Admin Operator */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#458B9E]/10 text-[#458B9E] font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(log.admin.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 leading-snug">{log.admin.name}</p>
                        <p className="text-xs text-gray-500">{log.admin.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Action Badge */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${actionBadge.className}`}
                    >
                      <ActionIcon className="w-3.5 h-3.5" />
                      <span>{actionBadge.label}</span>
                    </span>
                  </td>

                  {/* Target Entity */}
                  <td className="px-5 py-4">
                    {log.targetType ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                          <TargetIcon className="w-3 h-3 text-gray-500" />
                          <span>{log.targetType}</span>
                        </span>

                        {log.targetId && (
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 font-mono text-xs text-gray-600">
                            <span>{log.targetId.slice(0, 10)}…</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(log.targetId!)}
                              className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
                              title="Copy Target ID"
                            >
                              {copiedId === log.targetId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 font-mono">—</span>
                    )}
                  </td>

                  {/* Timestamp */}
                  <td className="px-5 py-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-700">{relTime}</span>
                      <span className="text-gray-400">({new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <ScrollText className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-gray-800 text-sm">No audit logs recorded</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            No administrative events match your search query or active category filters.
          </p>
        </div>
      )}
    </div>
  );
}
