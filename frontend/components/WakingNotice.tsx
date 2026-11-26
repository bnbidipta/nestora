'use client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/** Shown while the free backend wakes up from sleep (lib/api.ts retries meanwhile). */
export default function WakingNotice() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const h = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    window.addEventListener('nestora:waking', h);
    return () => window.removeEventListener('nestora:waking', h);
  }, []);
  if (!on) return null;
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-full border border-line bg-card px-5 py-3 text-sm text-ink shadow-lg">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-terra" aria-hidden />
      Warming up the design engine, about 30 seconds. Hang on, we'll carry on automatically.
    </div>
  );
}
