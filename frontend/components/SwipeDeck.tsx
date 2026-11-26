'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Loader2, X } from 'lucide-react';
import { SwipeCard, getSwipeCards, submitSwipe } from '@/lib/api';
import { track } from '@/lib/analytics';

/** Photo taste swipe. Stops as soon as one style clearly leads (10–24 swipes). Keyboard: ← pass, → like. */
export default function SwipeDeck() {
  const router = useRouter();
  const params = useSearchParams();
  const houseId = params.get('house');
  const picked = (params.get('styles') ?? '').split(',').filter(Boolean);
  const [cards, setCards] = useState<SwipeCard[]>([]);
  const [i, setI] = useState(0);
  const [max, setMax] = useState(24);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leader, setLeader] = useState<{ style: string; confidence: number } | null>(null);
  const shownAt = useRef(Date.now());

  useEffect(() => {
    getSwipeCards(picked).then((r) => { setCards(r.cards); setMax(r.max_swipes); }).catch((e) => setError(e.message));
  }, [params]);  // eslint-disable-line react-hooks/exhaustive-deps
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

  if (!houseId) return <p className="p-8 text-center text-ink/80">Start from the questionnaire so we know which house this is for.</p>;
  if (!cards.length) return <p className="flex items-center justify-center gap-2 p-8 text-ink/80">{error ?? <><Loader2 className="h-4 w-4 animate-spin" /> Loading photos…</>}</p>;

  const card = cards[i];
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>Do you like this? {i + 1} / up to {max}</span>
        <button type="button" onClick={finish} className="underline hover:text-ink">Skip to options</button>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-paper2"><div className="h-full bg-green transition-all" style={{ width: `${(100 * (i + 1)) / max}%` }} /></div>
      <figure className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.file} alt={card.alt} className="aspect-[4/3] w-full object-cover" />
        <figcaption className="px-3 py-2 text-xs text-muted">
          <strong className="text-ink">{card.style_name}</strong> · {card.ai ? 'AI-generated illustration of the style' : <>Photo: {card.author}, {card.licence} (<a href={card.url} target="_blank" rel="noopener noreferrer" className="underline">Wikimedia Commons</a>)</>}
        </figcaption>
      </figure>
      <div className="mt-5 flex justify-center gap-6">
        <button type="button" aria-label="Not for me (left arrow)" disabled={busy} onClick={() => swipe('left')}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-line bg-card text-ink/80 hover:border-red-400 hover:text-red-700 disabled:opacity-50">
          <X className="h-7 w-7" />
        </button>
        <button type="button" aria-label="I like this (right arrow)" disabled={busy} onClick={() => swipe('right')}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-green bg-green/10 text-green hover:bg-green/20 disabled:opacity-50">
          <Heart className="h-7 w-7" />
        </button>
      </div>
      {leader && leader.confidence > 0.1 && (
        <p className="mt-4 text-center text-sm text-muted">Leaning towards <strong className="text-ink">{cards.find((c) => c.style === leader.style)?.style_name ?? leader.style}</strong></p>
      )}
      {error && <p role="alert" className="mt-3 text-center text-sm text-red-700">{error}</p>}
    </div>
  );
}
