import Link from 'next/link';

/** Dark "drafting" shell for the app screens; the landing page keeps the ivory theme. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-200">
      <header className="border-b border-slate-800/80 px-4 py-3">
        <Link href="/" className="font-mono text-sm font-bold tracking-widest text-white">
          NESTORA
        </Link>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
