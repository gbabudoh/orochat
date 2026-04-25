import { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F5F5F5] to-[#F0F0F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center space-x-3 mb-8">
          <img src="/logo.png" alt="Orochat Logo" className="h-20 w-auto" />
        </Link>
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}

