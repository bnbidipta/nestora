'use client';

/** "What if" chips: preview a change re-solved near the current plan (new plan + cost), then keep it or not. */
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import PlanThumb from '@/components/PlanThumb';
import { WhatIf as Preview, whatIf } from '@/lib/api';
import { area, useLengthUnit } from '@/lib/units';

const CHIPS = [['study', 'Add a study'], ['guest', 'Add a guest room'], ['kitchen', 'Bigger kitchen'], ['floor', 'One more floor']] as const;
type Change = (typeof CHIPS)[number][0];
const lakh = (v: number) => `₹${(v / 1e5).toFixed(1)} L`;

export default function WhatIf({ houseId, onKept }: { houseId: string; onKept: () => void }) {
  const u = useLengthUnit();
  const [busy, setBusy] = useState<Change | 'keep' | null>(null);
  const [p, setP] = useState<Preview | null>(null);
  const [floor, setFloor] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const ask = async (c: Change) => {
    setBusy(c); setMsg(null); setP(null);
    try { setP(await whatIf(houseId, c)); setFloor(0); } catch (e) { setMsg(e instanceof Error ? e.message : 'That change could not be made.'); } finally { setBusy(null); }
  };
  const keep = async () => {
    if (!p) return;
    setBusy('keep');
    try { await whatIf(houseId, p.change as Change, true); setP(null); setMsg('Kept. The design, 3D and estimate are updated.'); onKept(); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Could not keep that change.'); } finally { setBusy(null); }
  };
  const floors = p ? Array.from(new Set(p.preview.map((r) => r.f))).sort() : [];
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#131926] p-4 print:hidden" aria-label="What if">
      <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-200"><Sparkles className="h-4 w-4 text-amber-300" aria-hidden />What if…</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map(([c, label]) => (
          <button key={c} type="button" disabled={busy !== null} onClick={() => ask(c)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${p?.change === c ? 'border-amber-300 bg-amber-300 text-slate-900' : 'border-slate-600 text-slate-200 hover:bg-slate-800'} disabled:opacity-60`}>
            {busy === c && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}{label}
          </button>
        ))}
      </div>
      {busy && busy !== 'keep' && <p className="mt-3 text-xs text-slate-400">Re-solving the plan and checking it against the rules…</p>}
      {msg && <p role="status" className="mt-3 text-sm text-amber-200">{msg}</p>}
      {p && (
        <div className="mt-4 grid gap-4 rounded-xl bg-ivory-50 p-3 text-slate-900 md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <div className="mb-2 flex gap-1">
              {floors.map((f) => (
                <button key={f} type="button" onClick={() => setFloor(f)} className={`rounded px-2 py-0.5 text-xs font-semibold ${f === floor ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>{f === 0 ? 'Ground' : `Floor ${f}`}</button>
              ))}
            </div>
            <div className="aspect-[4/3] rounded-lg bg-white p-2"><PlanThumb rooms={p.preview} floor={floor} envelope={p.envelope_ft} /></div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">{p.note}</p>
            <p>Cost: {lakh(p.cost_before_inr.expected)} → <b>{lakh(p.cost_inr.expected)}</b></p>
            <p>Built-up: {area(p.built_up_before_sqft, u)} → <b>{area(p.built_up_sqft, u)}</b></p>
            {p.dropped.length > 0 && <p className="text-xs text-amber-800">Left out to fit: {p.dropped.map((d) => d.replace(/_\d+$/, '').replace(/_/g, ' ')).join(', ')}</p>}
            <p className="text-xs text-slate-500">Checked against the rules; every room still reachable.</p>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={keep} disabled={busy !== null} className="flex-1 rounded-lg bg-sage-800 px-3 py-2 text-xs font-semibold text-white">
                {busy === 'keep' ? 'Keeping…' : 'Keep this change'}
              </button>
              <button type="button" onClick={() => setP(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">Discard</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
