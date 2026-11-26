'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { canEditLocally, claimHouse } from '@/lib/api';

/**
 * Anonymous houses expire after 7 days. This saves the house to the user's account,
 * sending them through sign-in first and claiming automatically on return (?claim=1).
 */
export default function SaveHouseButton({ houseId }: { houseId: string }) {
  const router = useRouter();
  const [state, setState] = useState<'hidden' | 'idle' | 'saving' | 'saved'>('hidden');
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push(`/login?next=${encodeURIComponent(`/house/${houseId}?claim=1`)}`);
      return;
    }
    setState('saving');
    setError(null);
    try {
      await claimHouse(houseId);
      setState('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setState('idle');
    }
  };

  useEffect(() => {
    // Only the browser that created an unclaimed house holds its edit token.
    if (!canEditLocally(houseId)) return;
    setState('idle');
    if (new URLSearchParams(window.location.search).get('claim') === '1') void save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houseId]);

  if (state === 'hidden') return null;
  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={save}
        disabled={state !== 'idle'}
        className="flex items-center gap-1.5 rounded-lg border border-amber-200/60 bg-amber-50/40 px-3 py-1.5 tabular-nums text-xs text-gold-dark transition hover:bg-amber-50/40 disabled:opacity-70"
      >
        {state === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : state === 'saved' ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Bookmark className="h-3.5 w-3.5" aria-hidden />}
        {state === 'saved' ? 'Saved to your account' : 'Save (expires in 7 days otherwise)'}
      </button>
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
