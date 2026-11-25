'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Heart, Loader2, RefreshCw } from 'lucide-react';
import { Option, OptionsResponse, chooseOption, selectOptions, startOptions } from '@/lib/api';
import { formatINR } from '@/lib/twin';
import { track } from '@/lib/analytics';
import { area, useLengthUnit } from '@/lib/units';
import PlanThumb from '@/components/PlanThumb';

const FIT_LABEL: Record<string, string> = {
  floors: 'Floors as asked', parking: 'Parking as asked', bedrooms: 'All bedrooms', study: 'Study', puja: 'Puja', guest: 'Guest room',
  help: "Help's room", elder_ground: 'Elder on ground floor',
};

export default function OptionsBoard({ houseId }: { houseId: string }) {
  const router = useRouter();
  const [res, setRes] = useState<OptionsResponse | null>(null);
  const [keep, setKeep] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<'start' | 'replace' | 'choose' | null>('start');
  const [error, setError] = useState<string | null>(null);
  const started = Date.now();

  useEffect(() => {
    startOptions(houseId)
      .then((r) => { setRes(r); track('options_shown', { ms: Date.now() - started }); })
      .catch((e) => setError(e.message))
      .finally(() => setBusy(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houseId]);

  const replace = async () => {
    if (!res) return;
    setBusy('replace');
    setError(null);
    const ids = res.options.map((o) => o.id);
    try {
      const r = await selectOptions(houseId, ids.filter((x) => keep.has(x)), ids.filter((x) => !keep.has(x)));
      setRes(r);
      track('options_replaced', { kept: keep.size, round: r.round ?? 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not get new options.');
    } finally {
      setBusy(null);
    }
  };

  const choose = async (id: string) => {
    setBusy('choose');
    setError(null);
    try {
      await chooseOption(houseId, id);
      track('design_chosen', { round: res?.round ?? 1 });
      router.push(`/house/${houseId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your choice.');
      setBusy(null);
    }
  };

  if (busy === 'start') return <p className="flex items-center justify-center gap-2 py-20 text-slate-300"><Loader2 className="h-5 w-5 animate-spin" /> Designing and checking layouts…</p>;
  if (error && !res) return <p role="alert" className="py-20 text-center text-red-400">{error}</p>;
  if (res && res.status === 'infeasible') {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl bg-ivory-50 p-6 text-slate-900">
        <h1 className="flex items-center gap-2 text-xl font-bold"><AlertTriangle className="h-5 w-5 text-amber-600" /> This plot can&apos;t fit a compliant house as briefed</h1>
        <p className="mt-3 text-slate-700">{res.reason}</p>
        <button type="button" onClick={() => router.push('/questionnaire')} className="mt-5 rounded-lg bg-sage-800 px-4 py-2 text-sm font-semibold text-white">Change my answers</button>
      </section>
    );
  }
  if (!res) return null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Your options</h1>
          <p className="text-sm text-slate-400">Like the ones you&apos;re drawn to and we&apos;ll show more like them, or pick one to open it.</p>
        </div>
        <button type="button" onClick={replace} disabled={busy !== null || keep.size === res.options.length}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50">
          {busy === 'replace' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {keep.size ? 'Show more like my liked ones' : 'Show different options'}
        </button>
      </div>
      {res.exhausted && <p className="mb-4 text-sm text-amber-300">That&apos;s every distinct layout this plot allows with your brief.</p>}
      {!res.exhausted && res.options.length < 4 && (
        <p className="mb-4 text-sm text-amber-300">
          Only {res.options.length} layout{res.options.length === 1 ? '' : 's'} pass every check
          {res.options.some((o) => Object.values(o.traditions).some((t) => t.mode === 'strict')) ? ' and your strict cultural preferences' : ''} on this plot.
          Relaxing a strict cultural preference to &ldquo;Follow where it fits&rdquo;, or allowing another floor, opens up more options.
        </p>
      )}
      {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {res.options.map((o, n) => (
          <OptionCard key={o.id} o={o} n={n + 1} kept={keep.has(o.id)} busy={busy !== null}
            onKeep={() => setKeep((s) => { const x = new Set(s); x.has(o.id) ? x.delete(o.id) : x.add(o.id); return x; })}
            onChoose={() => choose(o.id)} />
        ))}
      </div>
    </div>
  );
}

function OptionCard({ o, n, kept, busy, onKeep, onChoose }: { o: Option; n: number; kept: boolean; busy: boolean; onKeep: () => void; onChoose: () => void }) {
  const u = useLengthUnit();
  const [floor, setFloor] = useState(0);
  const floors = Array.from(new Set(o.preview.map((r) => r.f))).sort();
  const s = o.summary;
  const misses = Object.entries(o.score.brief_fit).filter(([, v]) => v < 1).map(([k]) => FIT_LABEL[k] ?? k);
  return (
    <article className={`rounded-2xl border bg-ivory-50 p-4 text-slate-900 ${kept ? 'border-rose-400 ring-2 ring-rose-400' : 'border-transparent'}`}>
      <header className="flex items-center justify-between">
        <h2 className="font-bold">Option {n}</h2>
        <div className="flex gap-1" role="tablist" aria-label="Floors">
          {floors.map((f) => (
            <button key={f} type="button" role="tab" aria-selected={f === floor} onClick={() => setFloor(f)}
              className={`rounded px-2 py-0.5 text-xs font-semibold ${f === floor ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {f === 0 ? (s.stilt ? 'Stilt' : 'Ground') : `Floor ${f}`}
            </button>
          ))}
        </div>
      </header>
      <ExteriorStill o={o} />
      <div className="mt-3 aspect-[4/3] rounded-lg bg-white p-2">
        <PlanThumb rooms={o.preview} floor={floor} envelope={s.envelope_ft} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-slate-500">Estimated cost</dt><dd className="text-right font-semibold">{formatINR(s.cost_inr.low)}–{formatINR(s.cost_inr.high)}</dd>
        <dt className="text-slate-500">Built-up</dt><dd className="text-right">{area(s.built_up_sqft, u)} · FSI {s.fsi_used}</dd>
        <dt className="text-slate-500">Bedrooms · floors</dt><dd className="text-right">{s.bedrooms} · {s.floors}{s.stilt ? ' (stilt parking)' : ''}</dd>
        <dt className="text-slate-500">Parking</dt><dd className="text-right">{s.parking === 'none' ? 'None' : s.parking === 'car' ? (s.stilt ? 'Car (under the house)' : 'Car') : 'Two-wheeler'}</dd>
        {Object.entries(o.traditions).map(([k, v]) => (
          <div key={k} className="contents"><dt className="text-slate-500">{k.replace('_', ' ')}</dt><dd className="text-right">{Math.round((v.score + 1) * 50)}% aligned</dd></div>
        ))}
      </dl>
      {(misses.length > 0 || s.dropped.length > 0) && (
        <p className="mt-2 text-xs text-amber-800">
          {misses.length > 0 && <>Doesn&apos;t meet: {misses.join(', ')}. </>}
          {s.dropped.length > 0 && <>Left out to fit: {s.dropped.map((d) => d.replace(/_\d+$/, '').replace(/_/g, ' ')).join(', ')}.</>}
        </p>
      )}
      {o.tradition_relaxed && <p className="mt-1 text-xs text-amber-800">Your strict cultural preferences can&apos;t all be met on this plot; this is the closest code-compliant layout.</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" aria-pressed={kept} onClick={onKeep} disabled={busy} aria-label={kept ? 'Liked' : 'Like'}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold ${kept ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'}`}>
          <Heart className={`h-4 w-4 ${kept ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden />{kept ? 'Liked' : 'Like'}
        </button>
        <button type="button" onClick={onChoose} disabled={busy} className="flex-1 rounded-lg bg-sage-800 px-3 py-2 text-sm font-semibold text-white hover:bg-sage-900">
          Use this design
        </button>
      </div>
    </article>
  );
}

const LOOK_NAME: Record<string, string> = { terrace: 'Terrace roof', sloped: 'Sloped tiled roof', stepped: 'Stepped, with roof pavilion', mixed: 'Part sloped, part terrace' };

/** The option's exterior, rendered once in the browser from its plan and architecture. */
function ExteriorStill({ o }: { o: Option }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    import('@/lib/houseStill').then(({ renderStill }) => {
      try { const url = renderStill(o.id, o.preview, o.look); if (live) setSrc(url); } catch { /* no WebGL: plan only */ }
    });
    return () => { live = false; };
  }, [o]);
  return (
    <figure className="mt-3 overflow-hidden rounded-lg bg-[#EFE8DC]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Exterior of this option: ${LOOK_NAME[o.look?.archetype ?? ''] ?? 'house'}`} className="aspect-[64/42] w-full object-cover" />
      ) : <div className="aspect-[64/42] w-full animate-pulse" aria-hidden />}
      {o.look && <figcaption className="px-3 py-1.5 text-xs font-semibold text-slate-700">{LOOK_NAME[o.look.archetype]}</figcaption>}
    </figure>
  );
}
