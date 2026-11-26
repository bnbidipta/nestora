import Link from 'next/link';
import UnitSwitch from '@/components/UnitSwitch';

/** App screens share the landing page's warm-light palette. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink print:bg-card">
      <header className="flex items-center justify-between border-b border-line/80 px-4 py-3 print:hidden">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={26} height={26} className="h-[26px] w-[26px]" />
          Nestora
        </Link>
        <UnitSwitch />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
