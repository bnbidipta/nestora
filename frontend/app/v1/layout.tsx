import type { Metadata } from 'next';

// Alternative landing kept for comparison; search engines should only list "/".
export const metadata: Metadata = { robots: { index: false, follow: true }, alternates: { canonical: '/' } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
