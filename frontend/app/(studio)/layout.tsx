import Link from 'next/link';
import UnitSwitch from '@/components/UnitSwitch';

/** Dark "drafting" shell for the app screens; the landing page keeps the ivory theme. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-200 print:bg-white">
      <header className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 print:hidden">
        <Link href="/" className="flex items-center gap-2 font-mono text-sm font-bold tracking-widest text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={26} height={26} className="h-[26px] w-[26px]" />
          NESTORA
        </Link>
        <UnitSwitch />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
