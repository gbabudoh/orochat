'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import CreateAdminModal from './CreateAdminModal';
import {
  UserPlus,
  Search,
  X,
  Shield,
  Sparkles,
  Copy,
  Check,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface AdminItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  createdAt: Date;
}

interface Props {
  admins: AdminItem[];
}

function getInitials(name: string) {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminsTableClient({ admins }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search Input + Add Admin Button */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Box */}
        <div className="relative flex items-center min-w-[260px] sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search admins by name or email…"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Add Admin Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 bg-[#458B9E] hover:bg-[#387383] text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Admin</span>
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Admin Account</th>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-5 py-3.5">Role & Access Level</th>
                <th className="px-5 py-3.5 text-right">Date Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50/80 transition-colors">
                  {/* Account Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-2xl font-bold text-xs flex items-center justify-center border shrink-0 ${
                          admin.role === 'SUPER_ADMIN'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {getInitials(admin.name)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-snug">{admin.name}</p>
                        <p className="text-xs text-gray-400 font-mono">ID: {admin.id.slice(0, 12)}…</p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">{admin.email}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(admin.email, admin.id)}
                        className="p-1 text-gray-400 hover:text-[#458B9E] hover:bg-gray-100 rounded-md transition-colors"
                        title="Copy email address"
                      >
                        {copiedId === admin.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    {admin.role === 'SUPER_ADMIN' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Super Admin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                        <span>Standard Admin</span>
                      </span>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{new Date(admin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredAdmins.length === 0 && (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 text-sm">No admin accounts found</h4>
              <p className="text-xs text-gray-500 mt-1">
                No administrative accounts match your search filter.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      <CreateAdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
