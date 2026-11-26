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
  if (!vocab) return null;

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
  if (!current) {  // designs made before exterior styling: one click applies the style's exterior
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4 print:hidden" aria-label="Customise exterior">
        <p className="text-sm text-ink/80">This design was made before exterior styling. Add its style's walls, windows, entrance and compound wall?</p>
        <button type="button" disabled={busy} onClick={() => send({ reset: true })} className="rounded-full bg-terra px-4 py-2 text-sm font-semibold text-white hover:bg-terra-dark disabled:opacity-50">{busy ? 'Applying…' : 'Turn on exterior styling'}</button>
        {msg && <p role="status" className="w-full text-sm text-gold-dark">{msg}</p>}
      </section>
    );
  }
  const sel = 'h-10 w-full rounded-2xl border border-line bg-card px-2 text-sm text-ink';

  return (
    <section className="rounded-2xl border border-line bg-card p-4 print:hidden" aria-label="Customise exterior">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 tabular-nums text-xs font-semibold uppercase tracking-wider text-ink"><Paintbrush className="h-4 w-4 text-gold-dark" aria-hidden />Customise exterior</h3>
        <button type="button" disabled={busy} onClick={() => send({ reset: true })} className="inline-flex items-center gap-1 text-xs text-muted underline disabled:opacity-50"><RotateCcw className="h-3 w-3" aria-hidden />Back to the style's defaults</button>
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send({ text }); }}>
        <label className="sr-only" htmlFor="ext-text">Describe the exterior you want</label>
        <input id="ext-text" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="e.g. exposed brick on the ground floor, white above, black window frames"
          className="h-11 flex-1 rounded-2xl border border-line bg-card px-3 text-sm text-ink" />
        <button type="submit" disabled={busy || !text.trim()} className="inline-flex items-center gap-1.5 rounded-full bg-terra px-4 text-sm font-semibold text-white hover:bg-terra-dark disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}Apply
        </button>
      </form>
      {msg && <p role="status" className="mt-2 text-sm text-gold-dark">{msg}</p>}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-ink/80">Ground floor walls
          <select className={sel} disabled={busy} value={current.wall[0]} onChange={(e) => send({ choices: { wall: [e.target.value, current.wall[1] ?? e.target.value] } })}>
            {Object.entries(vocab.wall.options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="text-xs text-ink/80">Upper floor walls
          <select className={sel} disabled={busy} value={current.wall[1] ?? current.wall[0]} onChange={(e) => send({ choices: { wall: [current.wall[0], e.target.value] } })}>
            {Object.entries(vocab.wall.options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        {Object.entries(vocab).filter(([k]) => k !== 'wall').map(([k, el]) => (
          <label key={k} className="text-xs text-ink/80">{el.label}
            <select className={sel} disabled={busy} value={String((current as unknown as Record<string, unknown>)[k] ?? '')} onChange={(e) => send({ choices: { [k]: e.target.value } })}>
              {Object.entries(el.options).map(([o, lbl]) => <option key={o} value={o}>{lbl}</option>)}
            </select>
          </label>
        ))}
        <label className="text-xs text-ink/80">Wall colour
          <input type="color" disabled={busy} defaultValue={current.wall_colour} onBlur={(e) => e.target.value !== current.wall_colour && send({ choices: { wall_colour: e.target.value } })} className="block h-10 w-full rounded-2xl border border-line bg-card" />
        </label>
        <label className="text-xs text-ink/80">Accent colour
          <input type="color" disabled={busy} defaultValue={current.accent_colour} onBlur={(e) => e.target.value !== current.accent_colour && send({ choices: { accent_colour: e.target.value } })} className="block h-10 w-full rounded-2xl border border-line bg-card" />
        </label>
      </div>
    </section>
  );
}
