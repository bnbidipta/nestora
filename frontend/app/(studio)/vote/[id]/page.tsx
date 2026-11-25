'use client';

/** Family vote: anyone with the link hearts the options they like. No sign-up; an optional first name. */
import { useEffect, useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import PlanThumb from '@/components/PlanThumb';
import { Option, castVote, readVote } from '@/lib/api';

const LOOK_NAME: Record<string, string> = { terrace: 'Terrace roof', sloped: 'Sloped tiled roof', stepped: 'Stepped, with roof pavilion', mixed: 'Part sloped, part terrace' };

function voterId(): string {
  try {
    const k = 'nestora_voter';
    let v = localStorage.getItem(k);
    if (!v) { v = `v${crypto.randomUUID().replace(/-/g, '')}`; localStorage.setItem(k, v); }
    return v;
  } catch { return `v${Math.random().toString(36).slice(2)}${Date.now()}`; }
}

export default function VotePage({ params }: { params: { id: string } }) {
  const [token, setToken] = useState('');
  const [opts, setOpts] = useState<Option[] | null>(null);
  const [tally, setTally] = useState<Record<string, string[]>>({});
  const [likes, setLikes] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const me = useMemo(() => (typeof window === 'undefined' ? '' : voterId()), []);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('t') ?? '';
    setToken(t);
    try { setName(localStorage.getItem('nestora_voter_name') ?? ''); } catch { /* private mode */ }
    readVote(params.id, t).then((r) => { setOpts(r.options); setTally(r.tally); }).catch((e) => setErr(e.message));
  }, [params.id]);

  const toggle = async (id: string) => {
    const next = likes.includes(id) ? likes.filter((x) => x !== id) : [...likes, id];
    setLikes(next);
    try { localStorage.setItem('nestora_voter_name', name); } catch { /* private mode */ }
    try { setTally((await castVote(params.id, { token, voter: me, name, likes: next })).tally); } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save your vote.'); }
  };

  if (err && !opts) return <p role="alert" className="py-20 text-center text-red-400">{err}</p>;
  if (!opts) return <p className="py-20 text-center text-slate-400">Loading the designs…</p>;
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-white">Which home do you like?</h1>
      <p className="mt-1 text-sm text-slate-400">Your family is choosing a house design. Tap the heart on the ones you like; you can pick more than one.</p>
      <label className="mt-4 block max-w-xs text-sm text-slate-300">Your name (optional)
        <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amma"
          className="mt-1 h-11 w-full rounded-lg border border-slate-600 bg-white px-3 text-slate-900" />
      </label>
      {err && <p role="alert" className="mt-3 text-sm text-red-400">{err}</p>}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {opts.map((o, i) => {
          const liked = likes.includes(o.id), who = tally[o.id] ?? [];
          return (
            <article key={o.id} className={`rounded-2xl bg-ivory-50 p-4 text-slate-900 ${liked ? 'ring-2 ring-rose-400' : ''}`}>
              <header className="flex items-center justify-between">
                <h2 className="font-bold">Option {i + 1}</h2>
                <span className="text-xs text-slate-500">{o.look ? LOOK_NAME[o.look.archetype] : ''}</span>
              </header>
              <div className="mt-3 aspect-[4/3] rounded-lg bg-white p-2"><PlanThumb rooms={o.preview} floor={0} envelope={o.summary.envelope_ft} /></div>
              <p className="mt-2 text-sm text-slate-600">{o.summary.bedrooms} bedrooms · {o.summary.floors} floor{o.summary.floors > 1 ? 's' : ''} · about ₹{(o.summary.cost_inr.expected / 1e5).toFixed(0)} lakh</p>
              <div className="mt-3 flex items-center justify-between">
                <button type="button" onClick={() => toggle(o.id)} aria-pressed={liked}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold ${liked ? 'bg-rose-500 text-white' : 'border border-slate-300 bg-white'}`}>
                  <Heart className={`h-4 w-4 ${liked ? 'fill-white' : ''}`} aria-hidden />{liked ? 'Liked' : 'Like'}
                </button>
                {who.length > 0 && <span className="text-xs text-rose-700">♥ {who.join(', ')}</span>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
