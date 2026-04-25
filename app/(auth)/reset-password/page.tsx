'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { resetPassword } from '@/features/auth/actions';

import { Suspense } from 'react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#333333] mb-3">Invalid link</h1>
        <p className="text-gray-600 mb-6">This password reset link is missing or malformed.</p>
        <Link href="/forgot-password" className="text-[#458B9E] hover:underline text-sm font-medium">
          Request a new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('password', password);
      const result = await resetPassword(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2500);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#333333] mb-3">Password updated</h1>
        <p className="text-gray-600">Your password has been changed. Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#333333] mb-2">Set new password</h1>
        <p className="text-gray-600">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Input
            type="password"
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          <p className="mt-1.5 text-xs text-gray-500">Must be at least 8 characters long</p>
        </div>

        <Input
          type="password"
          label="Confirm New Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Re-enter your password"
        />

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg text-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Update Password
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link href="/login" className="text-[#458B9E] hover:text-[#3a7585] font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

