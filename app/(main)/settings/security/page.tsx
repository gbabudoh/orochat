'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { changePassword } from '@/features/auth/actions';
import SecuritySettingsHeaderGuide from '@/components/feature/Settings/SecuritySettingsHeaderGuide';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { Eye, EyeOff, Lock, KeyRound, ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SecuritySettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    <div className="max-w-4xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#333333]">Security Settings</h1>
            <HelpTooltip
              title="Security Settings Guide"
              description="Manage account authentication, password updates, and session security."
              tips={[
                'Requires current password for verification before changing password.',
                'New passwords must be at least 8 characters long.',
                'Use eye toggles to inspect password entries before submitting.',
              ]}
            />
          </div>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
            Manage your password and protect your Orochat account.
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <SecuritySettingsHeaderGuide />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="md:col-span-2">
          <Card padding="none" className="p-4 sm:p-6 shadow-md border-t-4 border-[#458B9E]">
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#458B9E] flex items-center justify-center shrink-0 shadow-md">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Change Password</h2>
                  <p className="text-xs text-gray-500">Update your account password regularly to keep it secure.</p>
                </div>
              </div>
              <HelpTooltip
                title="Password Security"
                description="Encrypted password verification and updates."
                tips={[
                  'Must enter correct current password.',
                  'Minimum length 8 characters.',
                ]}
                align="right"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#333333] mb-1.5">
                  <Lock className="w-4 h-4 text-[#458B9E]" />
                  <span>Current Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    name="currentPassword"
                    placeholder="Enter your current password"
                    required
                    className="w-full px-4 py-2.5 pr-11 text-sm rounded-xl border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#458B9E] transition-colors"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#333333] mb-1.5">
                  <KeyRound className="w-4 h-4 text-[#458B9E]" />
                  <span>New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    name="newPassword"
                    placeholder="Enter your new password"
                    minLength={8}
                    required
                    className="w-full px-4 py-2.5 pr-11 text-sm rounded-xl border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#458B9E] transition-colors"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#333333] mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#458B9E]" />
                  <span>Confirm New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your new password"
                    minLength={8}
                    required
                    className="w-full px-4 py-2.5 pr-11 text-sm rounded-xl border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#458B9E] transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {message && (
                <div
                  className={`p-3.5 rounded-xl text-sm flex items-center gap-2 font-medium ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto px-6 py-2.5">
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Security Recommendations Card */}
        <div>
          <Card padding="none" className="p-4 sm:p-5 border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white">
            <div className="flex items-center gap-2.5 mb-3 text-[#458B9E]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-gray-900 text-base">Password Guidelines</h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>At least 8 characters long</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>Mix of uppercase & lowercase letters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>Include numbers & special characters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>Never share your password with anyone</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

