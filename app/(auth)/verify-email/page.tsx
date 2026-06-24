'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmailToken, resendVerificationEmail } from '@/features/auth/actions';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('This verification link is missing or malformed.');
      return;
    }

    verifyEmailToken(token).then((result) => {
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(result.error || 'This verification link is invalid or has expired.');
      }
    });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResending(true);
    try {
      const formData = new FormData();
      formData.append('email', resendEmail);
      await resendVerificationEmail(formData);
      setResendSent(true);
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Verifying your email…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#333333] mb-3">Email verified</h1>
        <p className="text-gray-600 mb-6">Your email has been confirmed. You can now sign in.</p>
        <Link href="/login">
          <Button className="w-full" size="lg">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-[#333333] mb-3">Verification failed</h1>
      <p className="text-gray-600 mb-6">{error}</p>

      {resendSent ? (
        <p className="text-sm text-green-600">
          If that email has an unverified Orochat account, a new verification link is on its way.
        </p>
      ) : (
        <form onSubmit={handleResend} className="space-y-4 text-left">
          <Input
            type="email"
            label="Email Address"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          <Button type="submit" className="w-full" isLoading={isResending}>
            Resend Verification Email
          </Button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <Link href="/login" className="text-[#458B9E] hover:text-[#3a7585] font-semibold transition-colors text-sm">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
