import { Suspense } from 'react';
import SwipeDeck from '@/components/SwipeDeck';

export default function SwipePage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="p-8 text-center text-muted">Loading Swipe Decks...</div>}>
        <SwipeDeck />
      </Suspense>
    </div>
  );
}
