import { ReactNode } from 'react';
import type { Metadata } from 'next';

// Overrides the parent (auth) group's noindex — signup is a conversion page
// worth ranking for, unlike login/forgot-password/reset-password.
export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Join Orochat for free — build verified professional connections, join Compass communities, and earn a share of ad revenue as a qualified Partner.',
  alternates: { canonical: '/signup' },
  robots: { index: true, follow: true },
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
