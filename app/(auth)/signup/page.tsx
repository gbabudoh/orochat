'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { signup } from '@/features/auth/actions';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);

      const result = await signup(formData);

      if (result.error) {
        setError(result.error);
      } else {
        // Auto-login after signup
        await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        router.push('/feed');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#333333] mb-2">Create Account</h1>
        <p className="text-gray-600">Join Orochat and start building your professional network</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="text"
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          placeholder="Enter your full name"
        />

        <Input
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />

        <div>
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
          />
          <p className="mt-1.5 text-xs text-gray-500">Must be at least 8 characters long</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg text-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-[#458B9E] hover:text-[#3a7585] font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By creating an account, you agree to our{' '}
          <Link href="/legal/terms" className="text-[#458B9E] hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/legal/privacy" className="text-[#458B9E] hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

