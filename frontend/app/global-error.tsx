'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/sentry';
import { body, display } from '@/lib/fonts';

/** Last-resort error page when the root layout itself fails. */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => reportError(error), [error]);
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#FAF7F2', color: '#1F1B16', fontFamily: 'var(--font-body), sans-serif', textAlign: 'center' }}>
        <main role="alert">
          <h1 style={{ fontFamily: 'var(--font-display), serif', fontWeight: 400 }}>Something went wrong</h1>
          <p>Please try again. If it keeps happening, reload the page.</p>
          <button type="button" onClick={reset} style={{ background: '#B4532A', color: '#fff', border: 0, borderRadius: 999, padding: '10px 20px', fontWeight: 600 }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
