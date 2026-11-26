'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const PlotHouse3D = dynamic(() => import('@/components/landing/PlotHouse3D'), { ssr: false });
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, Sparkles } from 'lucide-react';
import {
  Brief, StyleEntry, Strictness, createHouse, extractBrief, getStyles, getTraditions, joinWaitlist, saveBrief,
} from '@/lib/api';
import { InfoTip, NumberField, Select, TextArea, Toggle } from '@/components/form';
import { track } from '@/lib/analytics';
import PlotSize from '@/components/PlotSize';

const DEFAULT: Brief = {
  build_type: 'new_plot', city: 'mumbai', plot_width_ft: 30, plot_depth_ft: 40, road_width_m: 9, facing: 'E', corner_plot: false,
  soil: 'black_cotton', floors_wanted: 2, parking: 'two_wheeler', cars: 0, two_wheelers: 1, flood_prone: false, future_extra_floor: false, lift: 'none', low_maintenance: false, budget_inr: 4000000, tier: 'standard', adults: 2, elders: 0, couples: 1, singles: 0, elder_couples: 0, elder_singles: 0, bedrooms: null,
  elder_mobility_issue: false, kids: 0, pets: false, wfh_people: 0, joint_family: false, rental_floor: false, puja: 'nook',
  kitchen: 'closed', guest_room: false, help_room: false, laundry: false, store_room: false, master_dressing: false,
  terrace_garden: false, traditions: { vaastu: 'soft' }, styles: [], styles_locked: false, free_text: '',
};

const STEPS = ['Plot', 'Household', 'Rooms', 'Cultural preferences', 'Style', 'Budget & words'] as const;
// Road direction (8 points) -> the plot side the generator orients to.
// ponytail: diagonals snap clockwise to a cardinal side; carry the 8-point value to the backend when Vaastu rules need it.
const DIRS = [['N', 'North'], ['NE', 'North-east'], ['E', 'East'], ['SE', 'South-east'], ['S', 'South'], ['SW', 'South-west'], ['W', 'West'], ['NW', 'North-west']] as const;
const SHORT: Record<string, string> = {
  vaastu: 'Vaastu', mayamatam: 'Mayamatam (Dravidian Vastu)', sthapatya_veda: 'Sthapatya Veda', feng_shui: 'Feng Shui',
  islamic: 'Islamic home principles', jain: 'Jain home principles', biophilic: 'Nature-led (biophilic) design',
};
const LIFT_FROM = 3;  // storeys incl. ground; mirrors backend LIFT_FROM_FLOORS
const parkingOf = (cars: number, tw: number): Brief['parking'] => (cars > 0 ? 'car' : tw > 0 ? 'two_wheeler' : 'none');
const ROAD_M: Record<string, number> = { lane: 6, street: 9, main: 12, unsure: 9 };
const SNAP: Record<string, Brief['facing']> = { N: 'N', NE: 'E', E: 'E', SE: 'S', S: 'S', SW: 'W', W: 'W', NW: 'N', unsure: 'E' };
const lakh = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} crore` : `₹${(n / 1e5).toFixed(1)} lakh`);
const TIER_INFO = 'Economy: vitrified tiles, emulsion paint, flush doors. Standard: large-format tiles, premium emulsion, solid-core doors. Premium: marble or engineered wood, designer finishes, UPVC/aluminium windows.';

function readCountry(): string | null {
  if (typeof document === 'undefined') return null;
  return document.cookie.match(/(?:^|; )nestora_country=([A-Z]{2})/)?.[1] ?? null;
}

/** The API lists styles most-searched first (Google Trends, docs/research/style-search-trends.md). */
const POPULAR = 'Most popular';

export default function Questionnaire() {
  const router = useRouter();
  const [step, setStepRaw] = useState(0);
  const [roadDir, setRoadDir] = useState<string>('E');
  const [roadKind, setRoadKind] = useState<string>('street');
  const setStep = (f: number | ((s: number) => number)) => { setStepRaw(f); window.scrollTo({ top: 0 }); };
  const [b, setB] = useState<Brief>(DEFAULT);
  useEffect(() => {  // plot size typed on the landing page (?w=30&d=40)
    const q = new URLSearchParams(window.location.search), w = Number(q.get('w')), d = Number(q.get('d'));
    if (w >= 15 && w <= 200 && d >= 15 && d <= 300) setB((x) => ({ ...x, plot_width_ft: w, plot_depth_ft: d }));
  }, []);
  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setB((x) => ({ ...x, [k]: v }));
  const [styles, setStyles] = useState<StyleEntry[]>([]);
  const [traditions, setTraditions] = useState<{ id: string; name: string; description: string }[]>([]);
  const [group, setGroup] = useState(POPULAR);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [understood, setUnderstood] = useState<string[] | null>(null);
  const [houseId, setHouseId] = useState<string | null>(null);
  const [waitlist, setWaitlist] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<{ fields: Partial<Brief>; evidence: Record<string, string>; questions: string[] } | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    getStyles().then((r) => setStyles(r.styles)).catch(() => {});
    getTraditions().then((r) => setTraditions(r.traditions)).catch(() => {});
    setCountry(readCountry());
    track('questionnaire_start');
  }, []);

  const elderCount = 2 * (b.elder_couples ?? 0) + (b.elder_singles ?? 0);
  const suggestedBeds = Math.max(1, (b.couples ?? 0) + (b.singles ?? 0)) + (b.elder_couples ?? 0) + (b.elder_singles ?? 0) + Math.ceil(b.kids / 2) + (b.guest_room ? 1 : 0);
  const beds = b.bedrooms ? b.bedrooms + (b.guest_room ? 1 : 0) : suggestedBeds;
  useEffect(() => {  // keep the legacy adults/elders fields in step for the review summary and analytics
    setB((x) => ({ ...x, adults: Math.max(1, 2 * (x.couples ?? 0) + (x.singles ?? 0)), elders: 2 * (x.elder_couples ?? 0) + (x.elder_singles ?? 0) }));
  }, [b.couples, b.singles, b.elder_couples, b.elder_singles]);
  // ponytail: a 2-floor house with elders defaults to a lift once; the user can still turn it off.
  const hasElders = elderCount > 0;
  useEffect(() => { if (hasElders && b.floors_wanted === 2) setB((x) => (x.lift === 'none' ? { ...x, lift: 'lift' } : x)); }, [hasElders, b.floors_wanted]);
  const plotOk = b.plot_width_ft >= 15 && b.plot_depth_ft >= 15 && b.plot_width_ft <= 200 && b.plot_depth_ft <= 300;
  const outsidePilot = b.build_type !== 'new_plot' || b.city !== 'mumbai';
  const groups = useMemo(() => [POPULAR, ...Array.from(new Set(styles.map((s) => s.group)))], [styles]);

  const toggleStyle = (id: string) =>
    setB((x) => {
      const has = x.styles.includes(id);
      const next = has ? x.styles.filter((s) => s !== id) : [...x.styles, id];
      return { ...x, styles: next, styles_locked: next.length > 0 };
    });

  const readWords = async () => {
    setBusy(true);
    setError(null);
    try {
      setExtracted(await extractBrief(b.free_text));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!Number.isFinite(b.budget_inr) || !plotOk) {
      setError('Please check the plot size and budget.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = houseId ?? (await createHouse({}));
      setHouseId(id);
      const res = await saveBrief(id, b);
      setUnderstood(res.understood);
      setWaitlist(res.waitlist);
      track('questionnaire_complete', { floors: b.floors_wanted, tier: b.tier });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (understood && houseId) {
    return <Review understood={understood} waitlist={waitlist} brief={b} houseId={houseId} onEdit={() => setUnderstood(null)}
      onNext={(swipe) => router.push(swipe ? `/swipe?house=${houseId}${b.styles.length ? `&styles=${b.styles.join(',')}` : ''}` : `/house/${houseId}/options`)} />;
  }

  return (
    <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
    <div className="min-w-0">
      <ol className="mb-6 flex flex-wrap gap-1.5" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button type="button" onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}
              className={`rounded-full px-3 py-1 tabular-nums text-xs ${i === step ? 'bg-card text-ink' : i < step ? 'bg-line text-ink' : 'bg-paper2 text-muted'}`}>
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      {country && country !== 'IN' && (
        <p className="mb-4 rounded-xl border border-amber-200/50 bg-amber-50/40 p-3 text-sm text-gold-dark">
          Nestora is piloting in Mumbai, India. You can still try it with Mumbai rules, or join the waitlist for your city at the end.
        </p>
      )}

      <section className="rounded-2xl bg-card p-6 text-ink shadow-xl sm:p-8">
        {step === 0 && (
          <div className="space-y-6">
            <Header title="Your plot" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Select label="What are you planning?" value={b.build_type} onChange={(v) => set('build_type', v)} options={[
                { value: 'new_plot', label: 'New house on a plot' },
                { value: 'renovation', label: 'Renovate a house (coming soon)' },
                { value: 'flat_interior', label: 'Flat interiors (coming soon)' },
              ]} />
              <Select label="City" value={b.city} onChange={(v) => set('city', v)}
                options={[{ value: 'mumbai', label: 'Mumbai' }, { value: 'pune', label: 'Pune (coming soon)' }, { value: 'bengaluru', label: 'Bengaluru (coming soon)' },
                  { value: 'delhi', label: 'Delhi NCR (coming soon)' }, { value: 'other', label: 'Somewhere else (coming soon)' }]} />
              <PlotSize widthFt={b.plot_width_ft} lengthFt={b.plot_depth_ft} onChange={(w, l) => setB((x) => ({ ...x, plot_width_ft: w, plot_depth_ft: l }))} />
              {!plotOk && <p role="alert" className="text-sm text-red-700 sm:col-span-2">The plot must be 15–200 ft (5–60 m) wide and 15–300 ft (5–90 m) long.</p>}
              <Select label="Which side of the plot is the road on?" value={roadDir}
                onChange={(v) => { setRoadDir(v); set('facing', SNAP[v]); }}
                options={[...DIRS.map(([value, label]) => ({ value: value as string, label })), { value: 'unsure', label: 'Not sure' }]} />
              <Select label="Road in front" value={roadKind} onChange={(v) => { setRoadKind(v); set('road_width_m', ROAD_M[v]); }}
                info="The width of the road decides how many floors and how much built-up area the building rules allow."
                options={[{ value: 'lane', label: 'Narrow lane' }, { value: 'street', label: 'Normal street' }, { value: 'main', label: 'Main road' }, { value: 'unsure', label: 'Not sure' }]} />
              <Select label="Soil" value={b.soil} onChange={(v) => set('soil', v)} info="Not sure? Keep the default: we assume the weakest common soil, which is the safe choice."
                options={[{ value: 'black_cotton', label: "Don't know" }, { value: 'red_soil', label: 'Red / murrum soil' }, { value: 'hard_rock', label: 'Hard rock' }, { value: 'coastal', label: 'Coastal / reclaimed' }]} />
              <div className="hidden sm:block" />
              <Toggle label="Corner plot" info="Roads on two sides." checked={b.corner_plot} onChange={(v) => set('corner_plot', v)} />
              <Toggle label="The street floods in monsoon" info="We raise the plinth and add steps plus a ramp." checked={b.flood_prone} onChange={(v) => set('flood_prone', v)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <Header title="Who will live here?" />
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField label="Couples" value={b.couples ?? 0} min={0} max={6} onChange={(v) => set('couples', v)} />
              <NumberField label="Single adults" value={b.singles ?? 0} min={0} max={12} onChange={(v) => set('singles', v)} />
              <NumberField label="Elder couples" value={b.elder_couples ?? 0} min={0} max={3} onChange={(v) => set('elder_couples', v)} />
              <NumberField label="Single elders" value={b.elder_singles ?? 0} min={0} max={6} onChange={(v) => set('elder_singles', v)} />
              <NumberField label="Children" value={b.kids} min={0} max={8} onChange={(v) => set('kids', v)} />
              <NumberField label="Bedrooms" value={beds} min={1} max={9} onChange={(v) => set('bedrooms', Number.isFinite(v) ? Math.max(1, v - (b.guest_room ? 1 : 0)) : null)}
                info={`We suggest ${suggestedBeds}: one per couple, single adult, elder couple or single elder, and one per two children${b.guest_room ? ', plus the guest room' : ''}. Change it if you like.`} />
              <NumberField label="People working or studying from home" value={b.wfh_people} min={0} max={8} onChange={(v) => set('wfh_people', v)} />
              <Toggle label="Someone has trouble with stairs" info="They get a ground-floor bedroom, wider doors and step-free access." checked={b.elder_mobility_issue} onChange={(v) => set('elder_mobility_issue', v)} />
              <Toggle label="Pets" checked={b.pets} onChange={(v) => set('pets', v)} />
              <Toggle label="Joint family" info="Several households sharing the house." checked={b.joint_family} onChange={(v) => set('joint_family', v)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Header title="Rooms and how you live" />
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField label="Floors" value={b.floors_wanted} min={1} max={5} onChange={(v) => setB((x) => ({ ...x, floors_wanted: v, lift: v >= LIFT_FROM ? 'lift' : x.lift }))}
                info={`Counting the ground floor. The building rules for your plot and road set the maximum. A lift is required from ${LIFT_FROM} floors.`} />
              {b.floors_wanted >= LIFT_FROM ? (
                <Select label="Lift" value="lift" onChange={() => {}} info={`Required from ${LIFT_FROM} floors.`} options={[{ value: 'lift', label: 'Lift (required)' }]} />
              ) : b.floors_wanted > 1 ? (
                <Select label="Lift" value={b.lift} onChange={(v) => set('lift', v)} info={elderCount > 0 ? 'Recommended, since elders live here.' : undefined}
                  options={[{ value: 'none', label: 'No lift' }, { value: 'shaft', label: 'Leave space for a lift later' }, { value: 'lift', label: 'Lift now' }]} />
              ) : <div className="hidden sm:block" />}
              <NumberField label="Cars" value={b.cars} min={0} max={4} onChange={(v) => setB((x) => ({ ...x, cars: v, parking: parkingOf(v, x.two_wheelers) }))} />
              <NumberField label="Two-wheelers" value={b.two_wheelers} min={0} max={6} onChange={(v) => setB((x) => ({ ...x, two_wheelers: v, parking: parkingOf(x.cars, v) }))} />
              <Select label="Kitchen" value={b.kitchen} onChange={(v) => set('kitchen', v)}
                options={[{ value: 'closed', label: 'Closed kitchen' }, { value: 'open', label: 'Open kitchen' }]} />
              <Select label="Puja / prayer space" value={b.puja} onChange={(v) => set('puja', v)}
                options={[{ value: 'none', label: 'None' }, { value: 'nook', label: 'A corner or niche' }, { value: 'room', label: 'A separate room' }]} />
              <Toggle label="Guest bedroom" checked={b.guest_room} onChange={(v) => set('guest_room', v)} />
              <Toggle label="Room for live-in help" checked={b.help_room} onChange={(v) => set('help_room', v)} />
              <Toggle label="Wash / utility area" checked={b.laundry} onChange={(v) => set('laundry', v)} />
              <Toggle label="Store room" checked={b.store_room} onChange={(v) => set('store_room', v)} />
              <Toggle label="Dressing area in master bedroom" checked={b.master_dressing} onChange={(v) => set('master_dressing', v)} />
              <Toggle label="Terrace garden on top" checked={b.terrace_garden} onChange={(v) => set('terrace_garden', v)} />
              <Toggle label="Top floor as a rental unit" info="Separate kitchen and entry." checked={b.rental_floor} onChange={(v) => set('rental_floor', v)} />
              <Toggle label="We may add a floor later" info="Columns and footings are sized for it now, which costs a little more." checked={b.future_extra_floor} onChange={(v) => set('future_extra_floor', v)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Header title="Cultural preferences" info="Choose how strictly each one should guide where rooms go. Building codes and safety always come first." />
            {traditions.length === 0 && <p className="text-sm text-muted">Loading…</p>}
            <div className="grid gap-5 sm:grid-cols-2">
              {traditions.map((t) => (
                <Select key={t.id} label={SHORT[t.id] ?? t.name} info={t.description} value={(b.traditions[t.id] ?? 'off') as Strictness}
                  onChange={(v) => set('traditions', { ...b.traditions, [t.id]: v })}
                  options={[{ value: 'off', label: 'Off' }, { value: 'soft', label: 'Follow where it fits' }, { value: 'strict', label: 'Strictly' }]} />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <Header title="Style" />
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Style groups">
              {groups.map((g) => (
                <button key={g} role="tab" aria-selected={g === group} type="button" onClick={() => setGroup(g)}
                  className={`rounded-full border px-3 py-1 text-sm ${g === group ? 'border-green bg-terra text-white' : 'border-line bg-card text-ink/80'}`}>{g}</button>
              ))}
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {(group === POPULAR ? styles.slice(0, 12) : styles.filter((s) => s.group === group)).map((s) => {
                const on = b.styles.includes(s.id);
                return (
                  <button key={s.id} type="button" aria-pressed={on} onClick={() => toggleStyle(s.id)}
                    className={`overflow-hidden rounded-2xl border bg-card text-left transition ${on ? 'border-green ring-2 ring-terra' : 'border-line hover:border-muted/50'}`}>
                    <span className="relative block aspect-[3/2] bg-paper2">
                      {s.photo ? <img src={s.photo} alt={`${s.name} example`} loading="lazy" className="h-full w-full object-cover" />
                        : <span className="flex h-full">{(['wall', 'accent', 'wood', 'floor'] as const).map((k) => <span key={k} className="flex-1" style={{ background: s.palette[k] }} />)}</span>}
                      {on && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-terra text-white"><Check className="h-4 w-4" aria-hidden /></span>}
                    </span>
                    <span className="flex h-12 items-center px-3 font-semibold text-ink">{s.name}</span>
                  </button>
                );
              })}
            </div>
            <Toggle label="Prefer low-maintenance finishes" info="Swaps real wood, lime plaster and raw terracotta for durable lookalikes." checked={b.low_maintenance} onChange={(v) => set('low_maintenance', v)} />
            {b.styles.length > 0 && <p className="text-sm text-muted">Chosen: {b.styles.map((id) => styles.find((s) => s.id === id)?.name ?? id).join(', ')}</p>}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <Header title="Budget, and anything else" />
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField label="Construction budget" unit="₹" step={100000} min={100000} value={b.budget_inr} onChange={(v) => set('budget_inr', v)}
                info={`Construction only, not the land. Excludes GST and approvals.${Number.isFinite(b.budget_inr) ? ` That is ${lakh(b.budget_inr)}.` : ''}`} placeholder="e.g. 4000000" />
              <Select label="Finish level" value={b.tier} onChange={(v) => set('tier', v)} info={TIER_INFO}
                options={(['economy', 'standard', 'premium'] as const).map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))} />
            </div>
            <TextArea label="In your own words (optional)" rows={5} value={b.free_text} onChange={(v) => set('free_text', v)}
              placeholder="e.g. My mother has knee pain and can't climb stairs. We cook a lot of non-veg, so a closed kitchen. Strict Vaastu for the puja and kitchen."
              info="English, Hindi or Hinglish. Don't include names or phone numbers." />
            <button type="button" onClick={readWords} disabled={busy || !b.free_text.trim()}
              className="inline-flex items-center gap-2 rounded-2xl border border-green bg-card px-4 py-2 text-sm font-semibold text-green hover:bg-paper2 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Read my words
            </button>
            {extracted && (
              <ExtractPanel extracted={extracted} onApply={() => { setB((x) => ({ ...x, ...extracted.fields })); setExtracted(null); }} onDismiss={() => setExtracted(null)} />
            )}
          </div>
        )}

        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-paper2 disabled:invisible">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !plotOk}
              className="inline-flex items-center gap-1.5 rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-white hover:bg-terra-dark disabled:opacity-50">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-white hover:bg-terra-dark disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {outsidePilot ? 'Continue' : 'Review my brief'}
            </button>
          )}
        </div>
      </section>
    </div>
    <LiveHouse b={b} elders={hasElders} />
    </div>
  );
}

/** The house growing as the questions are answered: plot size, floors, car porch, terrace; what was added, listed. */
function LiveHouse({ b, elders }: { b: Brief; elders: boolean }) {
  const [grow, setGrow] = useState(0);
  const key = `${b.plot_width_ft}x${b.plot_depth_ft}x${b.floors_wanted}x${b.cars}`;
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / 1600); setGrow(p); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key]);
  const notes = [
    `${b.plot_width_ft} × ${b.plot_depth_ft} ft plot`,
    `${b.floors_wanted} floor${b.floors_wanted > 1 ? 's' : ''}${b.floors_wanted >= 3 ? ', with a lift' : ''}`,
    b.cars > 0 ? `Car porch for ${b.cars}` : b.two_wheelers > 0 ? `Two-wheeler parking` : null,
    elders ? 'Ground-floor bedroom for elders' : null,
    b.floors_wanted > 1 ? 'Terrace on the top floor' : null,
  ].filter(Boolean) as string[];
  return (
    <aside className="mt-6 lg:sticky lg:top-6 lg:mt-0 lg:self-start" aria-label="Your house so far">
      <div className="overflow-hidden rounded-2xl bg-paper2 text-ink shadow-xl">
        <PlotHouse3D plotW={b.plot_width_ft} plotD={b.plot_depth_ft} floors={b.floors_wanted} car={b.cars > 0} progress={grow} className="h-56 w-full lg:h-80" />
        <div className="space-y-1.5 p-4">
          <p className="tabular-nums text-[11px] uppercase tracking-widest text-muted">Your house so far</p>
          <ul className="space-y-1 text-sm">
            {notes.map((n) => <li key={n} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green" aria-hidden />{n}</li>)}
          </ul>
          <p className="pt-1 text-[11px] text-muted">A sketch to picture it; your real designs come next.</p>
        </div>
      </div>
    </aside>
  );
}

function Header({ title, info }: { title: string; info?: string }) {
  return <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">{title}{info && <InfoTip text={info} />}</h1>;
}

const FIELD_LABEL: Record<string, string> = {
  couples: 'Couples', singles: 'Single adults', elder_couples: 'Elder couples', elder_singles: 'Single elders', two_wheelers: 'Two-wheelers', cars: 'Cars', bedrooms: 'Bedrooms',
  elders: 'Elders', elder_mobility_issue: 'Finds stairs hard', kids: 'Children', pets: 'Pets', wfh_people: 'Work from home',
  joint_family: 'Joint family', rental_floor: 'Rental floor', puja: 'Puja', parking: 'Parking', floors_wanted: 'Floors', traditions: 'Cultural preferences', styles: 'Styles',
  plot_width_ft: 'Plot width (ft)', plot_depth_ft: 'Plot length (ft)', facing: 'Plot faces', corner_plot: 'Corner plot', lift: 'Lift',
  guest_room: 'Guest room', help_room: 'Help / servant room', master_dressing: 'Dressing room', store_room: 'Store room', laundry: 'Wash area',
};

function humanize(v: unknown): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  if (Array.isArray(v)) return v.map((x) => String(x).replace(/_/g, ' ')).join(', ');
  if (v && typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k.replace(/_/g, ' ')}: ${x}`).join(', ');
  return String(v).replace(/_/g, ' ');
}

function ExtractPanel({ extracted, onApply, onDismiss }: {
  extracted: { fields: Partial<Brief>; evidence: Record<string, string>; questions: string[] }; onApply: () => void; onDismiss: () => void;
}) {
  const entries = Object.entries(extracted.fields);
  return (
    <div className="rounded-xl border border-line bg-paper2 p-4">
      <p className="text-sm font-semibold text-ink">{entries.length ? 'From your words we picked up:' : "We couldn't pick out anything specific; the form above still counts."}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-ink">
        {entries.map(([k, v]) => (
          <li key={k}>
            <strong>{FIELD_LABEL[k] ?? k}:</strong> {humanize(v)}
            {extracted.evidence[k] && <span className="text-muted"> — “{extracted.evidence[k]}”</span>}
          </li>
        ))}
      </ul>
      {extracted.questions.length > 0 && (
        <div className="mt-3 text-sm text-ink/80">
          <p className="font-semibold">Worth clarifying:</p>
          <ul className="list-disc pl-5">{extracted.questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {entries.length > 0 && <button type="button" onClick={onApply} className="rounded-full bg-terra px-3 py-1.5 text-sm font-semibold text-white">Apply to my answers</button>}
        <button type="button" onClick={onDismiss} className="rounded-lg px-3 py-1.5 text-sm text-ink/80 hover:bg-card">Dismiss</button>
      </div>
    </div>
  );
}

function Review({ understood, waitlist, brief, houseId, onEdit, onNext }: {
  understood: string[]; waitlist: string | null; brief: Brief; houseId: string; onEdit: () => void; onNext: (swipe: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinWaitlist(waitlist as 'city' | 'flat_interior' | 'renovation', email, brief.city);
      setJoined(true);
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Could not join.');
    }
  };
  return (
    <section className="mx-auto max-w-2xl rounded-2xl bg-card p-6 text-ink shadow-xl sm:p-8">
      <h1 className="text-2xl font-bold">Here&apos;s what we understood</h1>
      <ul className="mt-4 space-y-2">
        {understood.map((s) => <li key={s} className="flex gap-2 text-ink"><Check className="mt-0.5 h-4 w-4 shrink-0 text-green" />{s}</li>)}
      </ul>
      {waitlist ? (
        <div className="mt-6 rounded-xl border border-gold bg-amber-50 p-4">
          <p className="flex items-center gap-2 font-semibold text-amber-900"><MapPin className="h-4 w-4" />
            {waitlist === 'city' ? 'Nestora is in pilot for Mumbai only.' : 'Renovations and flat interiors are coming soon.'}</p>
          {joined ? <p className="mt-2 text-sm text-amber-900">You&apos;re on the list. We&apos;ll email you once.</p> : (
            <form onSubmit={join} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label htmlFor="wl" className="sr-only">Email</label>
              <input id="wl" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="flex-1 rounded-2xl border border-line bg-card px-3 py-2 text-ink" />
              <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink">Join the waitlist</button>
            </form>
          )}
          {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}
          {waitlist === 'city' && <p className="mt-3 text-xs text-amber-900">You can still see a design using Mumbai rules below.</p>}
        </div>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={onEdit} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink/80">Change answers</button>
        {(!waitlist || waitlist === 'city') && (
          <>
            <button type="button" onClick={() => onNext(true)} className={`rounded-full px-4 py-2 text-sm font-semibold ${brief.styles_locked ? 'border border-green text-green' : 'bg-terra text-white'}`}>
              {brief.styles_locked ? 'Rank my styles with photos (1 min)' : 'Find my style (1 min swipe)'}
            </button>
            <button type="button" onClick={() => onNext(false)} className={`rounded-full px-4 py-2 text-sm font-semibold ${brief.styles_locked ? 'bg-terra text-white' : 'border border-green text-green'}`}>
              {brief.styles_locked ? 'See options' : 'Skip to options'}
            </button>
          </>
        )}
      </div>
      <p className="mt-4 tabular-nums text-xs text-muted">House {houseId}</p>
    </section>
  );
}
