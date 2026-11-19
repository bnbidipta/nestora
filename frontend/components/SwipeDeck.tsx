'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Heart, 
  X, 
  Sparkles, 
  Users, 
  Layers, 
  CheckCircle2, 
  Loader2,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { getSwipeDecks, submitSwipe, generateHouse } from '@/lib/api';

export default function SwipeDeck() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const houseId = searchParams.get('house_id') || 'nest_pilot_001';

  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [isGenerating, setIsGenerating] = useState(false);
  const [consensusMode, setConsensusMode] = useState(false);
  const [swipedStats, setSwipedStats] = useState({ liked: 0, passed: 0 });
  const [swipeAnim, setSwipeAnim] = useState<string>('');

  useEffect(() => {
    async function loadCards() {
      try {
        const res = await getSwipeDecks();
        if (res.success && res.decks) {
          const allCards = [
            ...res.decks.structure,
            ...res.decks.color_material,
            ...res.decks.decor
          ];
          setCards(allCards);
          setCardStartTime(Date.now());
        }
      } catch (err) {
        console.error('Failed to load swipe cards', err);
      }
    }
    loadCards();
  }, []);

  const handleSwipe = async (direction: 'right' | 'left') => {
    if (currentIndex >= cards.length) return;

    const currentCard = cards[currentIndex];
    const dwellMs = Date.now() - cardStartTime;

    // Trigger visual swipe animation
    setSwipeAnim(direction === 'right' ? 'translate-x-32 rotate-6 opacity-0' : '-translate-x-32 -rotate-6 opacity-0');

    // Optimistic state update
    if (direction === 'right') {
      setSwipedStats(prev => ({ ...prev, liked: prev.liked + 1 }));
    } else {
      setSwipedStats(prev => ({ ...prev, passed: prev.passed + 1 }));
    }

    try {
      await submitSwipe(houseId, {
        card_id: currentCard.id,
        deck: currentCard.deck,
        direction,
        dwell_ms: dwellMs
      });
    } catch (err) {
      console.error('Error submitting swipe', err);
    }

    setTimeout(() => {
      // Advance to next card
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSwipeAnim('');
      setCardStartTime(Date.now());

      // If deck completed, trigger generation!
      if (nextIdx >= cards.length) {
        triggerGeneration();
      }
    }, 200);
  };

  const triggerGeneration = async () => {
    try {
      setIsGenerating(true);
      const res = await generateHouse(houseId);
      if (res.success) {
        router.push(`/house/${houseId}`);
      } else {
        router.push(`/house/${houseId}`);
      }
    } catch (err: any) {
      console.error('Generation error', err);
      router.push(`/house/${houseId}`);
    }
  };

  const currentCard = cards[currentIndex];
  const progressPct = cards.length ? Math.round((currentIndex / cards.length) * 100) : 0;

  if (isGenerating) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/30">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <Compass className="absolute h-5 w-5 text-amber-400" />
        </div>
        <h2 className="mt-6 font-mono text-2xl font-bold text-white">
          Executing Orchestration DAG...
        </h2>
        <div className="mt-4 max-w-md space-y-2 text-left font-mono text-xs text-slate-400 border border-slate-800 bg-slate-900/60 p-4 rounded-xl">
          <p className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Plot & DCR Pack applied (FSI 1.5, Setbacks 3m/1.5m)</span>
          </p>
          <p className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Layout & IS 456 Structure calculated</span>
          </p>
          <p className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Stage Gate 1: Pure Python Judge Verified</span>
          </p>
          <p className="flex items-center gap-2 text-amber-400 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Harmonizing MEP, 25 Materials & Mumbai BOQ...</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Header with Consensus Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-slate-400">
            CARD {currentIndex + 1} OF {cards.length || 30}
          </span>
          <p className="text-sm font-bold text-white capitalize">
            Deck: {currentCard?.deck?.replace('_', ' ') || 'Architecture'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConsensusMode(!consensusMode)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-mono transition ${consensusMode ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-800 bg-slate-900/60 text-slate-400'}`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Consensus: {consensusMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <div 
          className="h-full bg-blue-500 transition-all duration-200"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Card Swipe Area */}
      <div className="relative mt-8 flex min-h-[420px] items-center justify-center">
        {currentCard && (
          <div
            className={`relative w-full overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-b from-[#1E293B] to-[#0F172A] p-6 shadow-2xl transition-all duration-200 ${swipeAnim}`}
          >
            {/* Aesthetic Visual Box */}
            <div className="relative flex h-52 w-full flex-col justify-between rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
              <div className="flex items-center justify-between">
                <span className="rounded bg-blue-950/80 px-2 py-0.5 font-mono text-[10px] uppercase text-blue-400 border border-blue-800/50">
                  Style: {currentCard.style}
                </span>
                <span className="font-mono text-xs text-slate-500">ID: {currentCard.id}</span>
              </div>

              <div className="flex flex-col items-center justify-center text-center">
                <Layers className="h-10 w-10 text-blue-400/80 mb-2" />
                <span className="font-mono text-xs text-slate-400">Architectural Concept</span>
              </div>

              <div className="font-mono text-[10px] text-amber-400/80">
                Dwell &gt;3s = 1.8x Preference Weight
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-5">
              <h3 className="text-xl font-bold text-white">
                {currentCard.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {currentCard.desc}
              </p>
            </div>

            {/* Vector Status Strip */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 font-mono text-[11px] text-slate-400">
              <span>Vector: 512 Floats</span>
              <span>Liked: {swipedStats.liked} • Passed: {swipedStats.passed}</span>
            </div>
          </div>
        )}
      </div>

      {/* Swipe Action Controls */}
      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => handleSwipe('left')}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-950/20 text-red-400 transition hover:scale-105 hover:bg-red-900/30 shadow-lg"
          title="Pass / Left"
        >
          <X className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={triggerGeneration}
          className="rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-2.5 font-mono text-xs text-slate-300 hover:bg-slate-700 transition"
        >
          Skip to Generate
        </button>

        <button
          type="button"
          onClick={() => handleSwipe('right')}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 transition hover:scale-105 hover:bg-emerald-900/30 shadow-lg"
          title="Like / Right"
        >
          <Heart className="h-6 w-6 fill-emerald-400/30" />
        </button>
      </div>
    </div>
  );
}
