'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LoginOptions from '@/components/LoginOptions';

/** Only allow redirects back into this site. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  // Arriving back from the magic link: supabase-js reads the session from the URL.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace(next);
    });
    return () => data.subscription.unsubscribe();
  }, [next, router]);

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl text-ink">Sign in to save your designs</h1>
      <p className="mt-2 text-sm text-muted">Keep your designs and pick up on any phone or computer.</p>
      <div className="mt-6"><LoginOptions next={next} /></div>
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
