'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/** Google first; email sign-in link as a small fallback. `next` is the in-site address to return to. */
export default function LoginOptions({ next }: { next: string }) {
  const [email, setEmail] = useState('');
  const [useEmail, setUseEmail] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const back = () => `${window.location.origin}/login?next=${encodeURIComponent(next)}`;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: back() } });
    if (error) { setError(error.message); setState('idle'); } else setState('sent');
  };

  return (
    <div>
      <button type="button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back() } })}
        className="w-full rounded-full bg-terra px-4 py-3 text-sm font-semibold text-white hover:bg-terra-dark">
        Continue with Google
      </button>
      {!useEmail ? (
        <button type="button" onClick={() => setUseEmail(true)} className="mt-3 w-full text-center text-xs text-muted underline">
          No Google account? Use email
        </button>
      ) : state === 'sent' ? (
        <p role="status" className="mt-4 rounded-2xl border border-line bg-paper2 p-4 text-sm text-ink">
          Check your inbox at <strong>{email}</strong> and open the link to continue.
        </p>
      ) : (
        <form onSubmit={send} className="mt-4 space-y-2">
          <label htmlFor="login-email" className="block text-sm text-ink/80">Email</label>
          <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-line bg-card px-3 py-2.5 text-ink" />
          <button type="submit" disabled={state === 'sending'} className="w-full rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">
            {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
          </button>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </form>
      )}
    </div>
  );
}
