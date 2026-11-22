'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Loader2, X } from 'lucide-react';
import { SwipeCard, getSwipeCards, submitSwipe } from '@/lib/api';
import { track } from '@/lib/analytics';

/** Photo taste swipe. Stops as soon as one style clearly leads (10–24 swipes). Keyboard: ← pass, → like. */
export default function SwipeDeck() {
  const router = useRouter();
  const houseId = useSearchParams().get('house');
  const [cards, setCards] = useState<SwipeCard[]>([]);
  const [i, setI] = useState(0);
  const [max, setMax] = useState(24);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leader, setLeader] = useState<{ style: string; confidence: number } | null>(null);
  const shownAt = useRef(Date.now());

  useEffect(() => {
    getSwipeCards().then((r) => { setCards(r.cards); setMax(r.max_swipes); }).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { shownAt.current = Date.now(); }, [i]);

  const finish = useCallback(() => {
    track('swipe_done', { swipes: i });
    router.push(`/house/${houseId}/options`);
  }, [houseId, i, router]);

  const swipe = useCallback(async (direction: 'left' | 'right') => {
    if (busy || !houseId || !cards[i]) return;
    setBusy(true);
    setError(null);
    try {
      const r = await submitSwipe(houseId, { card_id: cards[i].id, direction, dwell_ms: Date.now() - shownAt.current });
      const [style] = Object.entries(r.style_scores)[0] ?? [''];
      setLeader(style ? { style, confidence: r.confidence } : null);
      if (r.done || i + 1 >= cards.length) finish();
      else setI((x) => x + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that swipe.');
    } finally {
      setBusy(false);
    }
  }, [busy, cards, finish, houseId, i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') swipe('left');
      if (e.key === 'ArrowRight') swipe('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [swipe]);

  if (!houseId) return <p className="p-8 text-center text-slate-300">Start from the questionnaire so we know which house this is for.</p>;
  if (!cards.length) return <p className="flex items-center justify-center gap-2 p-8 text-slate-300">{error ?? <><Loader2 className="h-4 w-4 animate-spin" /> Loading photos…</>}</p>;

  const card = cards[i];
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
        <span>Do you like this? {i + 1} / up to {max}</span>
        <button type="button" onClick={finish} className="underline hover:text-white">Skip to layouts</button>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-slate-800"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${(100 * (i + 1)) / max}%` }} /></div>
      <figure className="mt-4 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.file} alt={card.alt} className="aspect-[4/5] w-full object-cover" />
        <figcaption className="px-3 py-2 text-xs text-slate-400">
          {card.alt}. Photo: {card.author} ({card.licence.split(' (')[0]}).
        </figcaption>
      </figure>
      <div className="mt-5 flex justify-center gap-6">
        <button type="button" aria-label="Not for me (left arrow)" disabled={busy} onClick={() => swipe('left')}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-900 text-slate-300 hover:border-red-400 hover:text-red-400 disabled:opacity-50">
          <X className="h-7 w-7" />
        </button>
        <button type="button" aria-label="I like this (right arrow)" disabled={busy} onClick={() => swipe('right')}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50">
          <Heart className="h-7 w-7" />
        </button>
      </div>
      {leader && leader.confidence > 0.1 && (
        <p className="mt-4 text-center text-sm text-slate-400">Leaning towards <strong className="text-slate-200">{leader.style.replace('_', ' ')}</strong></p>
      )}
      {error && <p role="alert" className="mt-3 text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
