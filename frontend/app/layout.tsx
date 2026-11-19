import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NESTORA — Global Autonomous Architecture Studio',
  description: 'AI Architectural Intelligence Platform. Mumbai 30x40 G+1 Pilot. Bespoke structural engineering, municipal compliance, and real-time House Twins.',
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
      </body>
    </html>
  );
}
