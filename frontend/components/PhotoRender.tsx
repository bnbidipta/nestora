'use client';

/**
 * The photoreal picture of the chosen design. "Make a photoreal picture" snapshots the 3D model from the street and
 * sends it to the GPU service; the page polls until the photo is ready. If the fast service is unavailable, the design
 * is queued for the free batch renderer and the photo appears later.
 */
import { useEffect, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { getHouse, requestPhoto, savePreview } from '@/lib/api';
import { HouseTwin } from '@/lib/twin';

export interface RenderInfo { status: 'queued' | 'working' | 'done'; key: string; photo?: string; ai?: boolean; fallback?: boolean; started?: number }

export default function PhotoRender({ twin, canEdit, onUpdate }: { twin: HouseTwin; canEdit: boolean; onUpdate: (t: HouseTwin) => void }) {
  const md = (twin.metadata ?? {}) as Record<string, any>;  // eslint-disable-line @typescript-eslint/no-explicit-any
  const raw = md.render as RenderInfo | undefined;
  // a job lost to a server restart stays 'working' forever; after 10 min offer the button again
  const render = raw?.status === 'working' && Date.now() / 1000 - (raw.started ?? 0) > 600 ? { ...raw, status: 'queued' as const } : raw;
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {  // while working, check every 5 s (up to 4 min)
    if (render?.status !== 'working') return;
    let n = 0;
    const id = setInterval(async () => {
      n += 1;
      try { const t = await getHouse(twin.house_id); if ((t.metadata as any)?.render?.status !== 'working' || n > 48) { clearInterval(id); onUpdate(t); } } catch { /* retry */ }  // eslint-disable-line @typescript-eslint/no-explicit-any
    }, 5000);
    return () => clearInterval(id);
  }, [render?.status, twin.house_id, onUpdate]);

  useEffect(() => {  // link previews (WhatsApp etc.) show this street view; refresh it when the design or look changes
    if (!canEdit || !raw?.key || (raw as { preview_key?: string }).preview_key === raw.key) return;
    const t = setTimeout(() => {
      import('@/lib/streetView').then(({ snapTwin }) => savePreview(twin.house_id, snapTwin(twin, 'image/jpeg'))).catch(() => {});
    }, 4000);  // after the 3D view has settled
    return () => clearTimeout(t);
  }, [canEdit, raw?.key, twin]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!render) return null;
  if (render.status === 'done' && render.photo) {
    return (
      <figure className="overflow-hidden rounded-2xl border border-line bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={render.photo} alt="Photoreal picture of this design" className="w-full" loading="lazy" />
        <figcaption className="px-4 py-2 text-xs text-muted">
          {render.ai ? 'AI-assisted photoreal picture of this exact design' : 'Rendered picture of this exact design'}; plants, sky and surroundings are illustrative.
        </figcaption>
      </figure>
    );
  }

  const make = async () => {
    setBusy(true); setErr(null);
    try {
      const { snapTwin } = await import('@/lib/streetView');
      const image = snapTwin(twin);
      await requestPhoto(twin.house_id, image);
      onUpdate(await getHouse(twin.house_id));
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not start the picture.'); } finally { setBusy(false); }
  };

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-4 text-sm text-ink/80 print:hidden">
      <Camera className="h-5 w-5 shrink-0 text-gold-dark" aria-hidden />
      {render.status === 'working' ? (
        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Painting your photo from the 3D model… usually under a minute.</span>
      ) : render.fallback ? (
        <span>The fast renderer is busy, so your photo is queued for the next batch; it will appear here within a few hours.</span>
      ) : canEdit ? (
        <>
          <span className="flex-1">See this exact design as a photo: walls, roof and windows from your 3D model.</span>
          <button type="button" onClick={make} disabled={busy} className="rounded-full bg-terra px-4 py-2 text-sm font-semibold text-white hover:bg-terra-dark disabled:opacity-60">
            {busy ? 'Starting…' : 'Make a photoreal picture'}
          </button>
        </>
      ) : <span>A photoreal picture of this design is on the way.</span>}
      {err && <p role="alert" className="w-full text-xs text-red-700">{err}</p>}
    </section>
  );
}
