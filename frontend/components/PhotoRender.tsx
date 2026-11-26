'use client';

/**
 * The photoreal picture of the chosen design. "Make a photoreal picture" snapshots the 3D model from the street and
 * sends it to the GPU service; the page polls until the photo is ready. If the fast service is unavailable, the design
 * is queued for the free batch renderer and the photo appears later.
 */
import { useEffect, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { getHouse, requestPhoto } from '@/lib/api';
import type { Look } from '@/lib/house3d';
import type { SnapRoom } from '@/lib/streetView';
import { HouseTwin } from '@/lib/twin';

export interface RenderInfo { status: 'queued' | 'working' | 'done'; key: string; photo?: string; ai?: boolean; fallback?: boolean }

export default function PhotoRender({ twin, canEdit, onUpdate }: { twin: HouseTwin; canEdit: boolean; onUpdate: (t: HouseTwin) => void }) {
  const md = (twin.metadata ?? {}) as Record<string, any>;  // eslint-disable-line @typescript-eslint/no-explicit-any
  const render = md.render as RenderInfo | undefined;
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
      const sbSide = Number(md.setback_side_m ?? 0) * 3.28084, sbFront = Number(md.setback_front_m ?? 0) * 3.28084;
      const rooms: SnapRoom[] = twin.floors.flatMap((f) => f.rooms.map((r) => ({ f: f.floor_no, name: r.name, t: r.type ?? '', x: r.x ?? 0, y: r.y ?? 0, w: r.length_ft, d: r.width_ft })));
      const { streetView } = await import('@/lib/streetView');
      const image = streetView(rooms, md.look as Look | undefined, [-sbSide, -sbFront, -sbSide + twin.plot.plot_width_ft, -sbFront + twin.plot.plot_depth_ft]);
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
          <button type="button" onClick={make} disabled={busy} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60">
            {busy ? 'Starting…' : 'Make a photoreal picture'}
          </button>
        </>
      ) : <span>A photoreal picture of this design is on the way.</span>}
      {err && <p role="alert" className="w-full text-xs text-red-700">{err}</p>}
    </section>
  );
}
