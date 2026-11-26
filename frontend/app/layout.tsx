import type { Metadata } from 'next';
import './globals.css';
import { Fraunces, Inter } from 'next/font/google';
import SentryInit from '@/components/SentryInit';
import WakingNotice from '@/components/WakingNotice';
import ConsentBanner from '@/components/ConsentBanner';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: 'Nestora: concept house design and cost estimates',
  description: 'Turn your plot, family and budget into a concept house design with automated rule checks and an itemized cost estimate, ready for a licensed architect to review. Mumbai pilot.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-paper text-ink font-sans antialiased selection:bg-green selection:text-paper">
        {children}
        <ConsentBanner />
        <SentryInit />
        <WakingNotice />
      </body>
    </html>
  );
}
