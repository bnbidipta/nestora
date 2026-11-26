'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Heart, Loader2, RefreshCw } from 'lucide-react';
import { Option, OptionsResponse, chooseOption, claimHouse, optionsProgress, selectOptions, startOptions, makeVoteLink, ownerVotes } from '@/lib/api';
import { formatINR } from '@/lib/twin';
import { supabase } from '@/lib/supabase';
import LoginOptions from '@/components/LoginOptions';
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
  const [votes, setVotes] = useState<Record<string, string[]>>({});
  const [voteMsg, setVoteMsg] = useState<string | null>(null);
  useEffect(() => {  // family hearts, refreshed while the board is open
    if (!res) return;
    const load = () => ownerVotes(houseId).then((r) => setVotes(r.tally)).catch(() => {});
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [houseId, res]);
  const askFamily = async () => {
    try {
      const { token } = await makeVoteLink(houseId);
      const url = `${window.location.origin}/vote/${houseId}?t=${token}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(`Help us choose our new home! Tap the heart on the designs you like: ${url}`)}`, '_blank', 'noopener');
      await navigator.clipboard?.writeText(url).catch(() => {});
      setVoteMsg('Voting link shared (and copied). Hearts from family will show on each option here.');
      track('family_vote_shared');
    } catch (e) { setVoteMsg(e instanceof Error ? e.message : 'Could not create a voting link.'); }
  };
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
  const pending = res?.pending ?? 0;

  useEffect(() => {  // more designs on their way: new cards are appended, shown ones never change
    if (!pending) return;
    const id = setInterval(() => {
      optionsProgress(houseId).then((p) => setRes((r) => {
        if (!r || p.round !== (r.round ?? 1)) return r;
        const have = new Set(r.options.map((o) => o.id));
        return { ...r, options: [...r.options, ...p.options.filter((o) => !have.has(o.id))], pending: p.pending };
      })).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [pending, houseId]);

  const [loginFor, setLoginFor] = useState<string | null>(null);

  useEffect(() => {
    const back = new URLSearchParams(window.location.search).get('choose');
    if (back) {  // returning from sign-in: finish the choice, keep the existing options
      void finish(back);
      return;
    }
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

  // Choosing a design needs an account, so the house is never lost to a cleared browser or a new phone.
  const choose = async (id: string) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setLoginFor(id); return; }
    await finish(id);
  };

  const finish = async (id: string) => {
    setBusy('choose');
    setError(null);
    try {
      await chooseOption(houseId, id);
      await claimHouse(houseId);  // saved to the account: no 7-day expiry (after choosing: claiming drops the edit token)
      track('design_chosen', { round: res?.round ?? 1 });
      router.push(`/house/${houseId}?intro=1`);  // open straight into the 3D walk-in
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your choice.');
      setBusy(null);
      if (new URLSearchParams(window.location.search).has('choose')) router.replace(`/house/${houseId}/options`);
    }
  };

  if (busy === 'start') return <Designing />;
  if (error && !res) {
    return (
      <div role="alert" className="py-20 text-center">
        <p className="text-red-700">{error}</p>
        <button type="button" onClick={() => location.reload()} className="mt-4 rounded-full bg-terra px-5 py-2 text-sm font-semibold text-white hover:bg-terra-dark">Try again</button>
      </div>
    );
  }
  if (res && res.status === 'infeasible') {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl bg-card p-6 text-ink">
        <h1 className="flex items-center gap-2 text-xl"><AlertTriangle className="h-5 w-5 text-gold-dark" /> This plot can&apos;t fit a compliant house as briefed</h1>
        <p className="mt-3 text-ink/80">{res.reason}</p>
        <button type="button" onClick={() => router.push('/questionnaire')} className="mt-5 rounded-full bg-terra px-4 py-2 text-sm font-semibold text-white">Change my answers</button>
      </section>
    );
  }
  if (!res) return null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl text-ink">Your options</h1>
          <p className="text-sm text-muted">Like the ones you&apos;re drawn to and we&apos;ll show more like them, or pick one to open it.</p>
        </div>
        <button type="button" onClick={askFamily} className="inline-flex items-center gap-2 rounded-lg border border-green px-4 py-2 text-sm font-semibold text-green hover:bg-emerald-50">
          Ask family on WhatsApp
        </button>
        <button type="button" onClick={replace} disabled={busy !== null || pending > 0 || keep.size === res.options.length}
          className="inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
          {busy === 'replace' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {keep.size ? 'Show more like my liked ones' : 'Show different options'}
        </button>
      </div>
      {voteMsg && <p role="status" className="mb-4 text-sm text-green">{voteMsg}</p>}
      {res.exhausted && <p className="mb-4 text-sm text-gold-dark">That&apos;s every distinct layout this plot allows with your brief.</p>}
      {!res.exhausted && !pending && res.options.length < 4 && (
        <p className="mb-4 text-sm text-gold-dark">
          Only {res.options.length} layout{res.options.length === 1 ? '' : 's'} pass every check
          {res.options.some((o) => Object.values(o.traditions).some((t) => t.mode === 'strict')) ? ' and your strict cultural preferences' : ''} on this plot.
          Relaxing a strict cultural preference to &ldquo;Follow where it fits&rdquo;, or allowing another floor, opens up more options.
        </p>
      )}
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      {cmp.length === 2 && (() => {
        const ia = res.options.findIndex((o) => o.id === cmp[0]), ib = res.options.findIndex((o) => o.id === cmp[1]);
        return ia >= 0 && ib >= 0 ? <Compare a={res.options[ia]} b={res.options[ib]} na={ia + 1} nb={ib + 1} onClose={() => setCmp([])} /> : null;
      })()}
      {cmp.length === 1 && <p className="mb-4 hidden text-sm text-ink/80 md:block">Tick one more option to compare.</p>}
      {phone ? (
        <SwipeDeck options={res.options} keep={keep} busy={busy !== null} onChoose={choose} onMore={replace}
          onLike={(id) => setKeep((s) => new Set(s).add(id))} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {res.options.map((o, n) => (
            <OptionCard key={o.id} o={o} n={n + 1} kept={keep.has(o.id)} busy={busy !== null}
              onKeep={() => setKeep((s) => { const x = new Set(s); x.has(o.id) ? x.delete(o.id) : x.add(o.id); return x; })}
              onChoose={() => choose(o.id)} comparing={cmp.includes(o.id)} family={votes[o.id]}
              onCompare={() => setCmp((c) => (c.includes(o.id) ? c.filter((x) => x !== o.id) : [...c, o.id].slice(-2)))} />
          ))}
          {Array.from({ length: pending ? Math.max(0, 4 - res.options.length) : 0 }, (_, i) => (
            <div key={`p${i}`} role="status" className="flex min-h-[22rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-card text-sm text-muted">
              <Loader2 className="h-6 w-6 animate-spin text-terra" aria-hidden />
              Designing option {res.options.length + i + 1}…
            </div>
          ))}
        </div>
      )}
      {loginFor && (
        <div role="dialog" aria-modal="true" aria-labelledby="login-title" className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center"
          onClick={() => setLoginFor(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="login-title" className="text-2xl text-ink">Save this design to your account</h2>
            <p className="mt-2 mb-5 text-sm text-muted">So you can open it on any phone and never lose it. We&apos;ll take you straight to your house.</p>
            <LoginOptions next={`/house/${houseId}/options?choose=${loginFor}`} />
            <button type="button" onClick={() => setLoginFor(null)} className="mt-4 w-full text-center text-xs text-muted">Not now</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OptionCard({ o, n, kept, busy, onKeep, onChoose, comparing, onCompare, family = [] }: { o: Option; n: number; kept: boolean; busy: boolean; onKeep: () => void; onChoose: () => void; comparing?: boolean; onCompare?: () => void; family?: string[] }) {
  const u = useLengthUnit();
  const [floor, setFloor] = useState(0);
  const floors = Array.from(new Set(o.preview.map((r) => r.f))).sort();
  const s = o.summary;
  const misses = Object.entries(o.score.brief_fit).filter(([, v]) => v < 1).map(([k]) => FIT_LABEL[k] ?? k);
  return (
    <article className={`rounded-2xl border bg-card p-4 text-ink ${kept ? 'border-rose-400 ring-2 ring-rose-400' : 'border-transparent'}`}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="">Option {n}</h2>
          {onCompare && (
            <label className="hidden cursor-pointer items-center gap-1 text-xs text-muted md:flex">
              <input type="checkbox" checked={!!comparing} onChange={onCompare} className="accent-terra" /> Compare
            </label>
          )}
        </div>
        <div className="flex gap-1" role="tablist" aria-label="Floors">
          {floors.map((f) => (
            <button key={f} type="button" role="tab" aria-selected={f === floor} onClick={() => setFloor(f)}
              className={`rounded px-2 py-0.5 text-xs font-semibold ${f === floor ? 'bg-card text-ink' : 'bg-paper2 text-ink/80'}`}>
              {f === 0 ? (s.stilt ? 'Stilt' : 'Ground') : `Floor ${f}`}
            </button>
          ))}
        </div>
      </header>
      {family.length > 0 && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">♥ Family likes it: {family.join(', ')}</p>}
      <ExteriorStill o={o} />
      <div className="mt-3 aspect-[4/3] rounded-lg bg-card p-2">
        <PlanThumb rooms={o.preview} floor={floor} envelope={s.envelope_ft} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">Estimated cost</dt><dd className="text-right font-semibold">{formatINR(s.cost_inr.low)}–{formatINR(s.cost_inr.high)}</dd>
        <dt className="text-muted">Built-up</dt><dd className="text-right">{area(s.built_up_sqft, u)} · FSI {s.fsi_used}</dd>
        <dt className="text-muted">Bedrooms · floors</dt><dd className="text-right">{s.bedrooms} · {s.floors}{s.stilt ? ' (stilt parking)' : ''}</dd>
        <dt className="text-muted">Parking</dt><dd className="text-right">{s.parking === 'none' ? 'None' : s.parking === 'car' ? (s.stilt ? 'Car (under the house)' : 'Car') : 'Two-wheeler'}</dd>
        {Object.entries(o.traditions).map(([k, v]) => (
          <div key={k} className="contents"><dt className="text-muted">{k.replace('_', ' ')}</dt><dd className="text-right">{Math.round((v.score + 1) * 50)}% aligned</dd></div>
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
          className={`inline-flex items-center justify-center gap-1.5 rounded-2xl border px-4 py-2 text-sm font-semibold ${kept ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-line bg-card text-ink hover:border-muted/50'}`}>
          <Heart className={`h-4 w-4 ${kept ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden />{kept ? 'Liked' : 'Like'}
        </button>
        <button type="button" onClick={onChoose} disabled={busy} className="flex-1 rounded-full bg-terra px-3 py-2 text-sm font-semibold text-white hover:bg-terra-dark">
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
    <figure className="mt-3 overflow-hidden rounded-lg bg-paper2">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Exterior of this option: ${LOOK_NAME[o.look?.archetype ?? ''] ?? 'house'}`} className="aspect-[64/42] w-full object-cover" />
      ) : <div className="aspect-[64/42] w-full animate-pulse" aria-hidden />}
      {o.look && <figcaption className="px-3 py-1.5 text-xs font-semibold text-ink/80">{LOOK_NAME[o.look.archetype]}</figcaption>}
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
      <div className="rounded-2xl bg-card p-6 text-center text-ink">
        <p className="font-semibold">You liked {keep.size} of {options.length}.</p>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" onClick={onMore} disabled={busy} className="rounded-full bg-terra px-4 py-2.5 text-sm font-semibold text-white">
            {keep.size ? 'Show more like my liked ones' : 'Show different options'}
          </button>
          <button type="button" onClick={() => setI(0)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold">Look again</button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-2 text-center text-xs text-muted">Swipe right to like, left to pass · {i + 1} of {options.length}</p>
      <AnimatePresence mode="popLayout">
        <motion.div key={o.id} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.8}
          onDragEnd={(_, info) => { if (info.offset.x > 110) next(true); else if (info.offset.x < -110) next(false); }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 0 }}
          whileDrag={{ rotate: 3 }} className="touch-pan-y">
          <OptionCard o={o} n={i + 1} kept={keep.has(o.id)} busy={busy} onKeep={() => next(true)} onChoose={() => onChoose(o.id)} />
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => next(false)} className="rounded-lg border border-line py-2 text-sm text-ink">Pass</button>
        <button type="button" onClick={() => next(true)} className="rounded-lg bg-rose-500 py-2 text-sm font-semibold text-white">Like</button>
      </div>
    </div>
  );
}
