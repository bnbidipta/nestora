'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm opacity-80">Please try again. If it keeps happening, reload the page.</p>
      <button type="button" onClick={reset} className="rounded-xl bg-[#26352C] px-4 py-2.5 text-sm font-semibold text-[#F7F6F2]">
        Try again
      </button>
    </main>
  );
}
