import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm opacity-80">This page doesn&apos;t exist, or the house was deleted or expired.</p>
      <Link href="/" className="rounded-xl bg-[#26352C] px-4 py-2.5 text-sm font-semibold text-[#F7F6F2]">
        Back to home
      </Link>
    </main>
  );
}
