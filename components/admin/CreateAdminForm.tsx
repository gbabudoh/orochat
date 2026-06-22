'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createAdmin } from '@/features/admin/admin-management-actions';

export default function CreateAdminForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createAdmin(formData);
    setIsLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Admin created');
      e.currentTarget.reset();
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
        <input name="name" required className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
        <input type="email" name="email" required className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
        <input type="password" name="password" required minLength={8} className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
        <select name="role" defaultValue="ADMIN" className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm">
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="col-span-2 bg-[#458B9E] hover:bg-[#3a7585] disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
      >
        {isLoading ? 'Creating…' : 'Create Admin'}
      </button>
    </form>
  );
}
