'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Deliberately not using next-auth/react's signIn() helper here: that client
// is a module-wide singleton bound to the consumer session's basePath
// (/api/auth, set up in lib/providers/AuthProvider.tsx). Running a second
// NextAuth instance at /api/admin-auth means talking to its REST endpoints
// directly so the two sessions never share client-side state.
async function adminSignIn(email: string, password: string) {
  const csrfRes = await fetch('/api/admin-auth/csrf');
  const { csrfToken } = await csrfRes.json();

  const res = await fetch('/api/admin-auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password, csrfToken, json: 'true' }),
  });

  if (!res.ok) return { error: 'Invalid email or password' };
  const data = await res.json().catch(() => null);
  if (data?.url?.includes('error=')) return { error: 'Invalid email or password' };
  return { error: null };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await adminSignIn(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1f2b] px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#333333] mb-1">Admin</h1>
          <p className="text-gray-500 text-sm">Orochat platform administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border-l-4 border-red-400 rounded-lg p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#458B9E] hover:bg-[#3a7585] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
