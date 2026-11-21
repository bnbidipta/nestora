'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/** Only allow redirects back into this site. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Arriving back from the magic link: supabase-js reads the session from the URL.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace(next);
    });
    return () => data.subscription.unsubscribe();
  }, [next, router]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError(error.message);
      setState('idle');
    } else {
      setState('sent');
    }
  };

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl font-bold text-white">Sign in to save your designs</h1>
      <p className="mt-2 text-sm text-slate-400">We&apos;ll email you a sign-in link. No password needed.</p>
      {state === 'sent' ? (
        <p role="status" className="mt-6 rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-4 text-sm text-emerald-300">
          Check your inbox at <strong>{email}</strong> and click the link to continue.
        </p>
      ) : (
        <form onSubmit={send} className="mt-6 space-y-3">
          <label htmlFor="email" className="block text-sm text-slate-300">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white"
          />
          <button type="submit" disabled={state === 'sending'} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50">
            {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
          </button>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
