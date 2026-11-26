'use client';

import { useEffect, useState } from 'react';
import { getConsent, setConsent, track } from '@/lib/analytics';

/** Asks once. Declining is as easy as accepting; nothing is sent before a choice. */
export default function ConsentBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(getConsent() === null), []);
  if (!show) return null;
  const choose = (c: 'granted' | 'denied') => {
    setConsent(c);
    setShow(false);
    if (c === 'granted') track('consent_granted');
  };
  return (
    <div role="dialog" aria-label="Privacy choice" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-line bg-card p-4 text-sm text-ink shadow-2xl">
      <p>We&apos;d like to count anonymous usage (which steps people finish) to improve the pilot. No names, emails or plot addresses are sent.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => choose('granted')} className="rounded-lg bg-card px-4 py-2 font-semibold text-ink">Allow</button>
        <button type="button" onClick={() => choose('denied')} className="rounded-lg border border-line px-4 py-2 font-semibold text-ink">Decline</button>
      </div>
    </div>
  );
}
