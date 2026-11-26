'use client';

/**
 * A printable A3 sheet of the chosen home (exterior, elevation, every floor plan, key numbers) that doubles as the
 * architect hand-off pack: print or save as PDF, plus the CAD drawing, the brief and the cost estimate.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Printer } from 'lucide-react';
import Elevation from '@/components/Elevation';
import PlanThumb from '@/components/PlanThumb';
import { dxfUrl, getHouse } from '@/lib/api';
import { Look } from '@/lib/house3d';
import { HouseTwin } from '@/lib/twin';
import { area, useLengthUnit } from '@/lib/units';

export default function Poster({ params }: { params: { id: string } }) {
  const u = useLengthUnit();
  const [twin, setTwin] = useState<HouseTwin | null>(null);
  const [still, setStill] = useState<string | null>(null);
  useEffect(() => { getHouse(params.id).then(setTwin).catch(() => {}); }, [params.id]);
  const md = (twin?.metadata ?? {}) as Record<string, any>;  // eslint-disable-line @typescript-eslint/no-explicit-any
  const rooms = twin ? twin.floors.flatMap((f) => f.rooms.map((r) => ({ f: f.floor_no, id: r.name, t: r.type ?? '', x: r.x ?? 0, y: r.y ?? 0, w: r.length_ft, d: r.width_ft }))) : [];
  useEffect(() => {
    if (!twin || !rooms.length) return;
    import('@/lib/houseStill').then(({ renderStillQueued }) => renderStillQueued(`poster-${twin.house_id}-${md.candidate_id}`, rooms, md.look as Look | undefined))
      .then(setStill).catch(() => {});
  }, [twin]);  // eslint-disable-line react-hooks/exhaustive-deps
  if (!twin) return <p className="py-20 text-center text-muted">Loading…</p>;
  const env: [number, number] = [Number(md.envelope_width_ft), Number(md.envelope_depth_ft)];
  const brief = JSON.stringify(md.brief ?? {}, null, 2);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <h1 className="mr-auto text-xl font-bold text-ink">Poster and architect pack</h1>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 text-sm font-semibold text-ink"><Printer className="h-4 w-4" />Print / save as PDF</button>
        <a href={dxfUrl(twin.house_id)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink"><Download className="h-4 w-4" />CAD drawing (DXF)</a>
        <a href={`data:application/json;charset=utf-8,${encodeURIComponent(brief)}`} download={`nestora-brief-${twin.house_id}.json`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink"><Download className="h-4 w-4" />Brief (JSON)</a>
        <Link href={`/house/${twin.house_id}/boq`} className="rounded-lg border border-line px-3 py-2 text-sm text-ink">Cost estimate</Link>
      </div>

      <article className="rounded-2xl bg-paper p-8 text-ink shadow-xl print:rounded-none print:p-0 print:shadow-none">
        <header className="flex items-end justify-between border-b border-line pb-4">
          <div>
            <p className="tabular-nums text-[11px] uppercase tracking-[0.25em] text-terra">Nestora concept design</p>
            <h2 className="font-display text-4xl">{twin.plot.plot_width_ft} × {twin.plot.plot_depth_ft} ft home, {twin.floors.length} floor{twin.floors.length > 1 ? 's' : ''}</h2>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="Nestora" width={40} height={40} />
        </header>
        <div className="mt-6 grid gap-6 md:grid-cols-2 print:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {md.render?.photo ? <img src={md.render.photo} alt="Photoreal picture of the home" className="w-full rounded-xl" />
            : still ? <img src={still} alt="Exterior of the home" className="w-full rounded-xl" /> : <div className="aspect-[12/7.6] animate-pulse rounded-xl bg-paper2" />}
          <Elevation twin={twin} />
        </div>
        <div className={`mt-6 grid gap-4 ${twin.floors.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {twin.floors.map((f) => (
            <figure key={f.floor_no} className="rounded-xl bg-card p-2">
              <PlanThumb rooms={rooms} floor={f.floor_no} envelope={env} />
              <figcaption className="mt-1 text-center text-xs text-muted">{f.floor_no === 0 ? 'Ground floor' : `Floor ${f.floor_no}`}</figcaption>
            </figure>
          ))}
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm md:grid-cols-4">
          <div><dt className="text-muted">Built-up</dt><dd className="font-display text-2xl">{area(Number(md.fsi_built_up_sqft), u)}</dd></div>
          <div><dt className="text-muted">Bedrooms</dt><dd className="font-display text-2xl">{twin.floors.flatMap((f) => f.rooms).filter((r) => (r.type ?? '').startsWith('bedroom')).length}</dd></div>
          <div><dt className="text-muted">Estimated cost</dt><dd className="font-display text-2xl">₹{(twin.boq.total_cost_inr / 1e5).toFixed(0)} lakh</dd></div>
          <div><dt className="text-muted">Rule checks</dt><dd className="font-display text-2xl">{md.final_judge?.pass ? 'Passed' : 'Needs review'}</dd></div>
        </dl>
        <p className="mt-6 text-[11px] text-muted">Concept design and estimate, not for construction. Building rules and rates are unverified drafts; a licensed architect and structural engineer must review and stamp any plan before you build.</p>
      </article>
    </div>
  );
}
