'use client';

/** Two options side by side as one plan that morphs from A to B with a slider: shared rooms slide, the rest fade. */
import { useState } from 'react';
import { Option } from '@/lib/api';
import { FILL, roomName } from '@/lib/rooms';
import { area, useLengthUnit } from '@/lib/units';
import { X } from 'lucide-react';

type R = Option['preview'][number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function Compare({ a, b, na, nb, onClose }: { a: Option; b: Option; na: number; nb: number; onClose: () => void }) {
  const u = useLengthUnit();
  const [t, setT] = useState(0);
  const [floor, setFloor] = useState(0);
  const floors = Array.from(new Set([...a.preview, ...b.preview].map((r) => r.f))).sort();
  const A = a.preview.filter((r) => r.f === floor), B = b.preview.filter((r) => r.f === floor);
  const ids = Array.from(new Set([...A, ...B].map((r) => r.id)));
  const W = Math.max(a.summary.envelope_ft[0], b.summary.envelope_ft[0]), D = Math.max(a.summary.envelope_ft[1], b.summary.envelope_ft[1]);
  const rooms = ids.map((id) => {
    const p = A.find((r) => r.id === id), q = B.find((r) => r.id === id);
    const s = p ?? q!, e = q ?? p!;
    const r: R = { ...s, x: lerp(s.x, e.x, t), y: lerp(s.y, e.y, t), w: lerp(s.w, e.w, t), d: lerp(s.d, e.d, t) };
    return { r, op: p && q ? 1 : p ? 1 - t : t };
  });
  const diff = (k: (o: Option) => number, fmt: (v: number) => string) => {
    const va = k(a), vb = k(b);
    return <span className={vb > va ? 'text-emerald-700' : vb < va ? 'text-rose-700' : ''}>{fmt(va)} → {fmt(vb)}</span>;
  };
  return (
    <section className="mb-6 rounded-2xl bg-ivory-50 p-4 text-slate-900 shadow-xl" aria-label={`Compare option ${na} and option ${nb}`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">Option {na} ↔ Option {nb}</h2>
        <div className="flex items-center gap-2">
          {floors.map((f) => (
            <button key={f} type="button" onClick={() => setFloor(f)} className={`rounded px-2 py-0.5 text-xs font-semibold ${f === floor ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>
              {f === 0 ? 'Ground' : `Floor ${f}`}
            </button>
          ))}
          <button type="button" onClick={onClose} aria-label="Close compare" className="rounded p-1 hover:bg-slate-200"><X className="h-4 w-4" /></button>
        </div>
      </header>
      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
        <svg viewBox={`-1 -1 ${W + 2} ${D + 2}`} className="max-h-[420px] w-full rounded-lg bg-white" role="img" aria-label="Plan morphing between the two options">
          {rooms.map(({ r, op }) => (
            <g key={r.id} opacity={op}>
              <rect x={r.x} y={D - r.y - r.d} width={r.w} height={r.d} fill={FILL[r.t] ?? '#EEE'} stroke="#334155" strokeWidth={0.15} />
              {r.w > 4 && r.d > 3 && <text x={r.x + r.w / 2} y={D - r.y - r.d / 2} fontSize={1.1} textAnchor="middle" dominantBaseline="middle" fill="#1f2937">{roomName(r.id, r.t, true)}</text>}
            </g>
          ))}
        </svg>
        <div className="space-y-3 text-sm">
          <label className="block text-xs font-semibold text-slate-600">Slide from option {na} to option {nb}
            <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} className="mt-2 w-full accent-[#B4532A]" />
          </label>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-slate-500">Built-up</dt><dd className="text-right">{diff((o) => o.summary.built_up_sqft, (v) => area(v, u))}</dd>
            <dt className="text-slate-500">Bedrooms</dt><dd className="text-right">{diff((o) => o.summary.bedrooms, String)}</dd>
            <dt className="text-slate-500">Cost (expected)</dt><dd className="text-right">{diff((o) => o.summary.cost_inr.expected, (v) => `₹${(v / 1e5).toFixed(1)} L`)}</dd>
            <dt className="text-slate-500">Look</dt><dd className="text-right">{a.look?.archetype ?? '–'} → {b.look?.archetype ?? '–'}</dd>
          </dl>
          <p className="text-xs text-slate-500">Rooms in both slide to their new place; rooms in only one fade in or out.</p>
        </div>
      </div>
    </section>
  );
}
