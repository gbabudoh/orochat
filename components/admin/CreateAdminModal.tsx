'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { createAdmin } from '@/features/admin/admin-management-actions';
import { UserPlus, Shield, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateAdminModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createAdmin(formData);
    setIsLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Admin user account created successfully');
      onClose();
      router.refresh();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Admin Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Admin Authorization</h4>
            <p className="mt-0.5 leading-relaxed">
              New admin users can log into the Admin Control Suite (`/admin/login`) with their credentials and role permissions.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Godwin Babudoh"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-xs transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="email"
              name="email"
              required
              placeholder="admin@orochat.com"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-xs transition-all outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                minLength={8}
                placeholder="Min 8 characters"
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-xs transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Role Level
            </label>
            <select
              name="role"
              defaultValue="ADMIN"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-xs transition-all outline-none bg-white"
            >
              <option value="ADMIN">Admin (Standard Access)</option>
              <option value="SUPER_ADMIN">Super Admin (Full System Access)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 bg-[#458B9E] hover:bg-[#397484] disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {isLoading ? 'Creating Admin…' : 'Create Admin'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
