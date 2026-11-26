'use client';

import { useState } from 'react';
import { sendContact } from '@/lib/api';

const TOPICS = [['question', 'A question'], ['problem', 'Something is not working'], ['architect', "I'm an architect or builder"], ['other', 'Something else']] as const;

/** Message + optional email (only if they want a reply). The hidden 'website' field catches bots. */
export default function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState('sending');
    setError(null);
    try {
      await sendContact({ topic: String(f.get('topic')), message: String(f.get('message')), email: String(f.get('email') || '') || undefined, website: String(f.get('website') || '') });
      setState('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send. Please try again.');
      setState('idle');
    }
  };

  if (state === 'sent') return <p role="status" className="mt-8 rounded-2xl border border-line bg-card p-5">Thank you, we&apos;ve got your message. If you left an email, we&apos;ll reply there.</p>;
  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-line bg-card p-6">
      <label className="block text-sm font-medium">What is it about?
        <select name="topic" className="mt-1.5 w-full rounded-2xl border border-line bg-card px-3 py-2.5 font-normal">
          {TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">Your message
        <textarea name="message" required minLength={5} maxLength={4000} rows={6} className="mt-1.5 w-full rounded-2xl border border-line bg-card px-3 py-2.5 font-normal" />
      </label>
      <label className="block text-sm font-medium">Email <span className="font-normal text-muted">(optional, only if you&apos;d like a reply)</span>
        <input name="email" type="email" autoComplete="email" maxLength={200} className="mt-1.5 w-full rounded-2xl border border-line bg-card px-3 py-2.5 font-normal" />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button type="submit" disabled={state === 'sending'} className="rounded-full bg-terra px-6 py-2.5 text-sm font-semibold text-white hover:bg-terra-dark disabled:opacity-50">
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <p className="text-xs text-muted">We use your message only to reply and improve Nestora. See our <a href="/privacy" className="underline">privacy policy</a>.</p>
    </form>
  );
}
