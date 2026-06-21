import { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Professionals',
  description: 'Discover and connect with verified professionals on Orochat — search by name, title, company, country, or industry category.',
  alternates: { canonical: '/explore' },
};

export default function ExploreLayout({ children }: { children: ReactNode }) {
  return children;
}
