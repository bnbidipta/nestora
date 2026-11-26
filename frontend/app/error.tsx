'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/sentry';

export default function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => reportError(error), [error]);
  return (
    <main role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl">Something went wrong</h1>
      <p className="text-sm opacity-80">Please try again. If it keeps happening, reload the page.</p>
      <button type="button" onClick={reset} className="rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-white hover:bg-terra-dark">
        Try again
      </button>
      <a href="/contact" className="text-sm text-muted underline">Tell us what happened</a>
    </main>
  );
}
