'use client';

/**
 * Customise exterior: one dropdown per element, wall and accent colours, and a free-text box ("exposed brick below,
 * white above, black frames"). Every change re-applies the look to the same plan, re-checks it, and the 3D updates.
 */
import { useEffect, useState } from 'react';
import { Loader2, Paintbrush, RotateCcw } from 'lucide-react';
import { exteriorVocab, setExterior } from '@/lib/api';
import type { Exterior } from '@/lib/house3d';

type Vocab = Record<string, { label: string; options: Record<string, string> }>;

export default function ExteriorPanel({ houseId, current, onChanged }: { houseId: string; current?: Exterior; onChanged: () => void }) {
  const [vocab, setVocab] = useState<Vocab | null>(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { exteriorVocab().then((r) => setVocab(r.elements)).catch(() => {}); }, []);
  if (!vocab || !current) return null;

  const send = async (body: { choices?: Record<string, unknown>; text?: string; reset?: boolean }) => {
    setBusy(true); setMsg(null);
    try {
      const r = await setExterior(houseId, body);
      const parts = [r.reply, r.unsupported.length ? `Can't do yet: ${r.unsupported.join(', ')}.` : ''].filter(Boolean);
      setMsg(parts.join(' ') || 'Updated and re-checked.');
      if (body.text) setText('');
      onChanged();
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Could not change the exterior.'); } finally { setBusy(false); }
  };
  const sel = 'h-10 w-full rounded-lg border border-slate-600 bg-white px-2 text-sm text-slate-900';

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#131926] p-4 print:hidden" aria-label="Customise exterior">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-200"><Paintbrush className="h-4 w-4 text-amber-300" aria-hidden />Customise exterior</h3>
        <button type="button" disabled={busy} onClick={() => send({ reset: true })} className="inline-flex items-center gap-1 text-xs text-slate-400 underline disabled:opacity-50"><RotateCcw className="h-3 w-3" aria-hidden />Back to the style's defaults</button>
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send({ text }); }}>
        <label className="sr-only" htmlFor="ext-text">Describe the exterior you want</label>
        <input id="ext-text" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="e.g. exposed brick on the ground floor, white above, black window frames"
          className="h-11 flex-1 rounded-lg border border-slate-600 bg-white px-3 text-sm text-slate-900" />
        <button type="submit" disabled={busy || !text.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-300 px-4 text-sm font-semibold text-slate-900 disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}Apply
        </button>
      </form>
      {msg && <p role="status" className="mt-2 text-sm text-amber-200">{msg}</p>}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-300">Ground floor walls
          <select className={sel} disabled={busy} value={current.wall[0]} onChange={(e) => send({ choices: { wall: [e.target.value, current.wall[1] ?? e.target.value] } })}>
            {Object.entries(vocab.wall.options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-300">Upper floor walls
          <select className={sel} disabled={busy} value={current.wall[1] ?? current.wall[0]} onChange={(e) => send({ choices: { wall: [current.wall[0], e.target.value] } })}>
            {Object.entries(vocab.wall.options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        {Object.entries(vocab).filter(([k]) => k !== 'wall').map(([k, el]) => (
          <label key={k} className="text-xs text-slate-300">{el.label}
            <select className={sel} disabled={busy} value={String((current as unknown as Record<string, unknown>)[k] ?? '')} onChange={(e) => send({ choices: { [k]: e.target.value } })}>
              {Object.entries(el.options).map(([o, lbl]) => <option key={o} value={o}>{lbl}</option>)}
            </select>
          </label>
        ))}
        <label className="text-xs text-slate-300">Wall colour
          <input type="color" disabled={busy} defaultValue={current.wall_colour} onBlur={(e) => e.target.value !== current.wall_colour && send({ choices: { wall_colour: e.target.value } })} className="block h-10 w-full rounded-lg border border-slate-600 bg-white" />
        </label>
        <label className="text-xs text-slate-300">Accent colour
          <input type="color" disabled={busy} defaultValue={current.accent_colour} onBlur={(e) => e.target.value !== current.accent_colour && send({ choices: { accent_colour: e.target.value } })} className="block h-10 w-full rounded-lg border border-slate-600 bg-white" />
        </label>
      </div>
    </section>
  );
}
