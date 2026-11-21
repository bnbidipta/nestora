'use client';

import { useEffect, useState } from 'react';
import { getHouse } from './api';
import type { HouseTwin } from './twin';

/** Loads one House Twin. Replaces the fetch block that was copy-pasted into every house page. */
export function useTwin(houseId: string | undefined) {
  const [twin, setTwin] = useState<HouseTwin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!houseId) return;
    let cancelled = false;
    setTwin(null);
    setError(null);
    getHouse(houseId)
      .then((t) => !cancelled && setTwin(t))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load this house.'));
    return () => {
      cancelled = true;
    };
  }, [houseId]);

  return { twin, error, loading: !twin && !error };
}
