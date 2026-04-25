'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { requestPasswordReset } from '@/features/auth/actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      const result = await requestPasswordReset(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-[#458B9E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#458B9E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#333333] mb-3">Check your email</h1>
        <p className="text-gray-600 mb-2">
          If an account exists for <span className="font-medium text-[#333333]">{email}</span>, we've sent reset instructions.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Didn't receive it? Check your spam folder or try again in a few minutes.
        </p>
        <Link href="/login" className="text-[#458B9E] hover:underline text-sm font-medium">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#333333] mb-2">Forgot password?</h1>
        <p className="text-gray-600">Enter your email and we'll send you a reset link.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
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
          Send Reset Link
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
