import { ReactNode } from 'react';
import Link from 'next/link';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/logo.png" alt="Orochat Logo" className="h-10 w-auto" />
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/explore" className="text-[#333333] hover:text-[#458B9E] transition-colors">
                Explore
              </Link>
              <Link href="/about" className="text-[#333333] hover:text-[#458B9E] transition-colors">
                About
              </Link>
              <Link href="/login" className="text-[#333333] hover:text-[#458B9E] transition-colors">
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-[#458B9E] text-white rounded-lg hover:bg-[#3a7585] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

