'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Heart, Loader2, RefreshCw } from 'lucide-react';
import { Option, OptionsResponse, chooseOption, selectOptions, startOptions } from '@/lib/api';
import { formatINR } from '@/lib/twin';
import { track } from '@/lib/analytics';
import { area, useLengthUnit } from '@/lib/units';
import PlanThumb from '@/components/PlanThumb';
import Designing from '@/components/Designing';
import Compare from '@/components/Compare';
import { AnimatePresence, motion } from 'framer-motion';

const FIT_LABEL: Record<string, string> = {
  floors: 'Floors as asked', parking: 'Parking as asked', bedrooms: 'All bedrooms', study: 'Study', puja: 'Puja', guest: 'Guest room',
  help: "Help's room", elder_ground: 'Elder on ground floor',
};

export default function OptionsBoard({ houseId }: { houseId: string }) {
  const router = useRouter();
  const [res, setRes] = useState<OptionsResponse | null>(null);
  const [keep, setKeep] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<'start' | 'replace' | 'choose' | null>('start');
  const [cmp, setCmp] = useState<string[]>([]);
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
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
      router.push(`/house/${houseId}?intro=1`);  // open straight into the 3D walk-in
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your choice.');
      setBusy(null);
    }
  };

  if (busy === 'start') return <Designing />;
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
      {cmp.length === 2 && (() => {
        const ia = res.options.findIndex((o) => o.id === cmp[0]), ib = res.options.findIndex((o) => o.id === cmp[1]);
        return ia >= 0 && ib >= 0 ? <Compare a={res.options[ia]} b={res.options[ib]} na={ia + 1} nb={ib + 1} onClose={() => setCmp([])} /> : null;
      })()}
      {cmp.length === 1 && <p className="mb-4 hidden text-sm text-slate-300 md:block">Tick one more option to compare.</p>}
      {phone ? (
        <SwipeDeck options={res.options} keep={keep} busy={busy !== null} onChoose={choose} onMore={replace}
          onLike={(id) => setKeep((s) => new Set(s).add(id))} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {res.options.map((o, n) => (
            <OptionCard key={o.id} o={o} n={n + 1} kept={keep.has(o.id)} busy={busy !== null}
              onKeep={() => setKeep((s) => { const x = new Set(s); x.has(o.id) ? x.delete(o.id) : x.add(o.id); return x; })}
              onChoose={() => choose(o.id)} comparing={cmp.includes(o.id)}
              onCompare={() => setCmp((c) => (c.includes(o.id) ? c.filter((x) => x !== o.id) : [...c, o.id].slice(-2)))} />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionCard({ o, n, kept, busy, onKeep, onChoose, comparing, onCompare }: { o: Option; n: number; kept: boolean; busy: boolean; onKeep: () => void; onChoose: () => void; comparing?: boolean; onCompare?: () => void }) {
  const u = useLengthUnit();
  const [floor, setFloor] = useState(0);
  const floors = Array.from(new Set(o.preview.map((r) => r.f))).sort();
  const s = o.summary;
  const misses = Object.entries(o.score.brief_fit).filter(([, v]) => v < 1).map(([k]) => FIT_LABEL[k] ?? k);
  return (
    <article className={`rounded-2xl border bg-ivory-50 p-4 text-slate-900 ${kept ? 'border-rose-400 ring-2 ring-rose-400' : 'border-transparent'}`}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-bold">Option {n}</h2>
          {onCompare && (
            <label className="hidden cursor-pointer items-center gap-1 text-xs text-slate-600 md:flex">
              <input type="checkbox" checked={!!comparing} onChange={onCompare} className="accent-[#B4532A]" /> Compare
            </label>
          )}
        </div>
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
    import('@/lib/houseStill')
      .then(({ renderStillQueued }) => renderStillQueued(o.id, o.preview, o.look))
      .then((url) => { if (live) setSrc(url); })
      .catch(() => { /* no WebGL: plan only */ });
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

/** Phones: one option at a time. Swipe right to like, left to pass; after the last, see more like the liked ones. */
function SwipeDeck({ options, keep, busy, onLike, onChoose, onMore }: {
  options: Option[]; keep: Set<string>; busy: boolean; onLike: (id: string) => void; onChoose: (id: string) => void; onMore: () => void;
}) {
  const [i, setI] = useState(0);
  const o = options[i];
  const next = (like: boolean) => { if (like && o) onLike(o.id); setI((x) => x + 1); };
  if (!o) {
    return (
      <div className="rounded-2xl bg-ivory-50 p-6 text-center text-slate-900">
        <p className="font-semibold">You liked {keep.size} of {options.length}.</p>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" onClick={onMore} disabled={busy} className="rounded-lg bg-sage-800 px-4 py-2.5 text-sm font-semibold text-white">
            {keep.size ? 'Show more like my liked ones' : 'Show different options'}
          </button>
          <button type="button" onClick={() => setI(0)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Look again</button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-2 text-center text-xs text-slate-400">Swipe right to like, left to pass · {i + 1} of {options.length}</p>
      <AnimatePresence mode="popLayout">
        <motion.div key={o.id} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.8}
          onDragEnd={(_, info) => { if (info.offset.x > 110) next(true); else if (info.offset.x < -110) next(false); }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 0 }}
          whileDrag={{ rotate: 3 }} className="touch-pan-y">
          <OptionCard o={o} n={i + 1} kept={keep.has(o.id)} busy={busy} onKeep={() => next(true)} onChoose={() => onChoose(o.id)} />
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => next(false)} className="rounded-lg border border-slate-600 py-2 text-sm text-slate-200">Pass</button>
        <button type="button" onClick={() => next(true)} className="rounded-lg bg-rose-500 py-2 text-sm font-semibold text-white">Like</button>
      </div>
    </div>
  );
}
