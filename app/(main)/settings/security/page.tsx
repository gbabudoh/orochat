'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { changePassword } from '@/features/auth/actions';

export default function SecuritySettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await changePassword(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Password updated successfully' });
        e.currentTarget.reset();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Security Settings</h1>
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            name="currentPassword"
            label="Current Password"
            placeholder="Enter your current password"
            required
          />

          <Input
            type="password"
            name="newPassword"
            label="New Password"
            placeholder="Enter your new password"
            minLength={8}
            required
          />

          <Input
            type="password"
            name="confirmPassword"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            minLength={8}
            required
          />

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-600' 
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {message.text}
            </div>
          )}

          <Button type="submit" isLoading={isLoading}>Update Password</Button>
        </form>
      </Card>
    </div>
  );
}
