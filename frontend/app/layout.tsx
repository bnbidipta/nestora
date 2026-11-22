import type { Metadata } from 'next';
import './globals.css';
import ConsentBanner from '@/components/ConsentBanner';

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
    <html lang="en">
      <body className="min-h-screen bg-[#F7F6F2] text-[#1A241E] font-sans antialiased selection:bg-[#26352C] selection:text-[#F7F6F2]">
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
