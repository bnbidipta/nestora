'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, Sparkles } from 'lucide-react';
import {
  Brief, StyleEntry, Strictness, createHouse, extractBrief, getStyles, getTraditions, joinWaitlist, saveBrief,
} from '@/lib/api';
import { NumberInput, Segmented, Select, Stepper, TextArea, Toggle } from '@/components/form';
import { track } from '@/lib/analytics';

const DEFAULT: Brief = {
  build_type: 'new_plot', city: 'mumbai', plot_width_ft: 30, plot_depth_ft: 40, road_width_m: 9, facing: 'E', corner_plot: false,
  soil: 'black_cotton', floors_wanted: 2, parking: 'two_wheeler', cars: 1, flood_prone: false, future_extra_floor: false, lift: 'none', low_maintenance: false, budget_inr: 4000000, tier: 'standard', adults: 2, elders: 0,
  elder_mobility_issue: false, kids: 0, pets: false, wfh_people: 0, joint_family: false, rental_floor: false, puja: 'nook',
  kitchen: 'closed', dining_seats: 4, guest_room: false, help_room: false, laundry: false, store_room: false, master_dressing: false,
  terrace_garden: false, traditions: { vaastu: 'soft' }, styles: [], styles_locked: false, free_text: '',
};

const STEPS = ['Plot', 'Household', 'Rooms', 'Traditions', 'Style', 'Budget & words'] as const;
const lakh = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} crore` : `₹${(n / 1e5).toFixed(1)} lakh`);
const TIER_HINT = { economy: 'Vitrified tiles, emulsion paint, flush doors', standard: 'Large-format tiles, premium emulsion, solid-core doors', premium: 'Marble/engineered wood, designer finishes, UPVC/aluminium systems' };

function readCountry(): string | null {
  if (typeof document === 'undefined') return null;
  return document.cookie.match(/(?:^|; )nestora_country=([A-Z]{2})/)?.[1] ?? null;
}

export default function Questionnaire() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [b, setB] = useState<Brief>(DEFAULT);
  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setB((x) => ({ ...x, [k]: v }));
  const [styles, setStyles] = useState<StyleEntry[]>([]);
  const [traditions, setTraditions] = useState<{ id: string; name: string; description: string }[]>([]);
  const [group, setGroup] = useState('Indian regional');
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

  const plotOk = b.plot_width_ft >= 15 && b.plot_depth_ft >= 15 && b.plot_width_ft <= 200 && b.plot_depth_ft <= 300;
  const outsidePilot = b.build_type !== 'new_plot' || b.city !== 'mumbai';
  const groups = useMemo(() => Array.from(new Set(styles.map((s) => s.group))), [styles]);

  const toggleStyle = (id: string) =>
    setB((x) => {
      const has = x.styles.includes(id);
      const next = has ? x.styles.filter((s) => s !== id) : [...x.styles, id].slice(-3);
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
      onNext={(swipe) => router.push(swipe ? `/swipe?house=${houseId}` : `/house/${houseId}/options`)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-6 flex flex-wrap gap-1.5" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button type="button" onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}
              className={`rounded-full px-3 py-1 font-mono text-xs ${i === step ? 'bg-white text-slate-900' : i < step ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-400'}`}>
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      {country && country !== 'IN' && (
        <p className="mb-4 rounded-xl border border-amber-700/50 bg-amber-950/40 p-3 text-sm text-amber-200">
          Nestora is piloting in Mumbai, India. You can still try it with Mumbai rules, or join the waitlist for your city at the end.
        </p>
      )}

      <section className="rounded-2xl bg-ivory-50 p-6 text-slate-900 shadow-xl sm:p-8">
        {step === 0 && (
          <div className="space-y-6">
            <Header title="Your plot" sub="Setbacks and floor area (FSI) depend on plot size and the road in front." />
            <Segmented label="What are you planning?" value={b.build_type} onChange={(v) => set('build_type', v)} options={[
              { value: 'new_plot', label: 'New house on a plot', sub: 'Full design + estimate' },
              { value: 'renovation', label: 'Renovate a house', sub: 'Waitlist' },
              { value: 'flat_interior', label: 'Flat interiors', sub: 'Waitlist' },
            ]} />
            <Select label="City" value={b.city} onChange={(v) => set('city', v)} hint="Only Mumbai's building rules are loaded today."
              options={[{ value: 'mumbai', label: 'Mumbai (pilot)' }, { value: 'pune', label: 'Pune (waitlist)' }, { value: 'bengaluru', label: 'Bengaluru (waitlist)' },
                { value: 'delhi', label: 'Delhi NCR (waitlist)' }, { value: 'other', label: 'Somewhere else (waitlist)' }]} />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput label="Plot width (road side)" unit="ft" value={b.plot_width_ft} min={15} max={200} onChange={(v) => set('plot_width_ft', v)} placeholder="e.g. 30" />
              <NumberInput label="Plot depth" unit="ft" value={b.plot_depth_ft} min={15} max={300} onChange={(v) => set('plot_depth_ft', v)} placeholder="e.g. 40" />
            </div>
            {plotOk && <p className="text-xs text-slate-500">Plot area {(b.plot_width_ft * b.plot_depth_ft).toLocaleString('en-IN')} sqft ({(b.plot_width_ft * b.plot_depth_ft * 0.0929).toFixed(0)} m²).</p>}
            <Segmented label="Width of the road in front" hint="Wider roads allow more floor area (FSI) under DCPR 2034." value={b.road_width_m} onChange={(v) => set('road_width_m', v)}
              options={[{ value: 6, label: 'Under 9 m', sub: 'Lane' }, { value: 9, label: '9 m' }, { value: 12, label: '12 m' }, { value: 18, label: '18 m +', sub: 'Main road' }]} />
            <Segmented label="Which direction does the road side face?" hint="Stand on the road looking at the plot: which way is your back facing? Used for sunlight and traditions."
              value={b.facing} onChange={(v) => set('facing', v)} options={[{ value: 'N', label: 'North' }, { value: 'E', label: 'East' }, { value: 'S', label: 'South' }, { value: 'W', label: 'West' }]} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-3">
                <Toggle label="Corner plot" hint="Roads on two sides" checked={b.corner_plot} onChange={(v) => set('corner_plot', v)} />
                <Toggle label="The street floods in monsoon" hint="We raise the plinth and add steps plus a ramp" checked={b.flood_prone} onChange={(v) => set('flood_prone', v)} />
              </div>
              <Select label="Soil" value={b.soil} onChange={(v) => set('soil', v)} hint="Not sure? Keep the default: we assume the weakest common Mumbai soil."
                options={[{ value: 'black_cotton', label: "Don't know / black cotton" }, { value: 'red_soil', label: 'Red / murrum soil' }, { value: 'hard_rock', label: 'Hard rock (basalt)' }, { value: 'coastal', label: 'Coastal / reclaimed' }]} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <Header title="Who will live here?" sub="Sizes bedrooms, bathrooms and what goes on the ground floor." />
            <div className="grid gap-5 sm:grid-cols-3">
              <Stepper label="Adults" value={b.adults} min={1} max={12} onChange={(v) => set('adults', v)} hint="Couples share a bedroom." />
              <Stepper label="Elders (65+)" value={b.elders} min={0} max={6} onChange={(v) => set('elders', v)} hint="Get a ground-floor bedroom." />
              <Stepper label="Children" value={b.kids} min={0} max={8} onChange={(v) => set('kids', v)} />
            </div>
            {b.elders > 0 && (
              <Segmented label="Does anyone find stairs hard?" value={b.elder_mobility_issue ? 'yes' : 'no'} onChange={(v) => set('elder_mobility_issue', v === 'yes')}
                options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes', sub: 'Knee pain, walker or wheelchair: wider doors, step-free' }]} />
            )}
            <Stepper label="People working or studying from home" value={b.wfh_people} min={0} max={8} onChange={(v) => set('wfh_people', v)} hint="One or more adds a study." />
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Pets" hint="Scratch-resistant floors" checked={b.pets} onChange={(v) => set('pets', v)} />
              <Toggle label="Joint family" hint="Several households sharing the house" checked={b.joint_family} onChange={(v) => set('joint_family', v)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Header title="Rooms and how you live" sub="Optional rooms are kept only if they fit at legal minimum sizes; we'll tell you what didn't fit." />
            <Segmented label="Floors" hint="Mumbai allows up to about 10 m (G+2) for houses like this." value={b.floors_wanted} onChange={(v) => set('floors_wanted', v)}
              options={[{ value: 1, label: 'Ground only' }, { value: 2, label: 'G + 1' }, { value: 3, label: 'G + 2' }]} />
            <Segmented label="Parking" hint="A car needs a 2.5 × 5 m bay. On 30 ft plots it often doesn't fit; we'll show alternatives." value={b.parking} onChange={(v) => set('parking', v)}
              options={[{ value: 'none', label: 'None' }, { value: 'two_wheeler', label: 'Two-wheeler' }, { value: 'car', label: 'Car' }]} />
            {b.parking === 'car' && (
              <Segmented label="How many cars?" value={b.cars} onChange={(v) => set('cars', v)} options={[{ value: 1, label: '1 car' }, { value: 2, label: '2 cars', sub: 'Needs about 5.4 m of frontage' }]} />
            )}
            {b.floors_wanted > 1 && (
              <Segmented label="Lift" hint="A lift needs a 1.6 m core next to the stair on every floor." value={b.lift} onChange={(v) => set('lift', v)}
                options={[{ value: 'none', label: 'No lift' }, { value: 'shaft', label: 'Reserve a shaft', sub: 'Fit the lift later' }, { value: 'lift', label: 'Lift now' }]} />
            )}
            <Toggle label="We may add a floor later" hint="Columns and footings are sized for it now (costs a little more)" checked={b.future_extra_floor} onChange={(v) => set('future_extra_floor', v)} />
            <Segmented label="Kitchen" value={b.kitchen} onChange={(v) => set('kitchen', v)}
              options={[{ value: 'closed', label: 'Closed kitchen', sub: 'Separate dining; keeps smells and tadka out' }, { value: 'open', label: 'Open kitchen', sub: 'Flows into living and dining' }]} />
            {b.kitchen === 'closed' && (
              <Segmented label="Dining table seats" value={b.dining_seats} onChange={(v) => set('dining_seats', v)}
                options={[{ value: 4, label: '4' }, { value: 6, label: '6' }, { value: 8, label: '8' }]} />
            )}
            <Segmented label="Puja / prayer space" value={b.puja} onChange={(v) => set('puja', v)}
              options={[{ value: 'none', label: 'None' }, { value: 'nook', label: 'A corner or niche' }, { value: 'room', label: 'A separate room' }]} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Guest bedroom" checked={b.guest_room} onChange={(v) => set('guest_room', v)} />
              <Toggle label="Room for live-in help" checked={b.help_room} onChange={(v) => set('help_room', v)} />
              <Toggle label="Wash / utility area" hint="Wet kitchen work, washing machine, drying" checked={b.laundry} onChange={(v) => set('laundry', v)} />
              <Toggle label="Store room" checked={b.store_room} onChange={(v) => set('store_room', v)} />
              <Toggle label="Dressing area in master bedroom" checked={b.master_dressing} onChange={(v) => set('master_dressing', v)} />
              <Toggle label="Terrace garden on top" hint="Leaves part of the top floor open" checked={b.terrace_garden} onChange={(v) => set('terrace_garden', v)} />
              <Toggle label="Top floor as a rental unit" hint="Separate kitchen and entry" checked={b.rental_floor} onChange={(v) => set('rental_floor', v)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <Header title="Traditions" sub="Choose how strictly each one should guide room placement. Building codes and safety always come first." />
            {traditions.length === 0 && <p className="text-sm text-slate-500">Loading…</p>}
            {traditions.map((t) => (
              <Segmented key={t.id} label={t.name} hint={t.description} value={(b.traditions[t.id] ?? 'off') as Strictness}
                onChange={(v) => set('traditions', { ...b.traditions, [t.id]: v })}
                options={[{ value: 'off', label: 'Off' }, { value: 'soft', label: 'Prefer', sub: 'Follow where it fits' }, { value: 'strict', label: 'Strict', sub: 'Reject layouts that break core rules' }]} />
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <Header title="Style" sub="Pick up to 3 styles you love, or skip and let a quick photo swipe find your taste." />
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Style groups">
              {groups.map((g) => (
                <button key={g} role="tab" aria-selected={g === group} type="button" onClick={() => setGroup(g)}
                  className={`rounded-full border px-3 py-1 text-sm ${g === group ? 'border-sage-700 bg-sage-700 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{g}</button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {styles.filter((s) => s.group === group).map((s) => {
                const on = b.styles.includes(s.id);
                return (
                  <button key={s.id} type="button" aria-pressed={on} onClick={() => toggleStyle(s.id)}
                    className={`rounded-xl border bg-white p-3 text-left transition ${on ? 'border-sage-700 ring-2 ring-sage-700' : 'border-slate-300 hover:border-slate-400'}`}>
                    <div className="mb-2 flex h-6 overflow-hidden rounded">
                      {(['wall', 'accent', 'wood', 'floor'] as const).map((k) => <span key={k} title={k} className="flex-1" style={{ background: s.palette[k] }} />)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{s.name}</span>
                      {on && <Check className="h-4 w-4 text-sage-700" aria-hidden />}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{s.features.slice(0, 3).map((f) => (f.length > 48 ? f.slice(0, 46).replace(/[\s,(]+\S*$/, '') + '…' : f)).join(' · ')}</p>
                    <p className="mt-1 text-xs text-slate-500">Mumbai: {s.mumbai}</p>
                  </button>
                );
              })}
            </div>
            <Toggle label="Prefer low-maintenance finishes" hint="Swaps real wood, lime plaster and raw terracotta for durable lookalikes" checked={b.low_maintenance} onChange={(v) => set('low_maintenance', v)} />
            <p className="text-sm text-slate-600">{b.styles.length ? `Chosen: ${b.styles.map((id) => styles.find((s) => s.id === id)?.name ?? id).join(', ')}` : 'Nothing chosen: the photo swipe will decide.'}</p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <Header title="Budget, and anything else" sub="Construction budget, not including the land." />
            <NumberInput label="Construction budget" unit="₹" step={100000} min={100000} value={b.budget_inr} onChange={(v) => set('budget_inr', v)}
              hint={Number.isFinite(b.budget_inr) ? `${lakh(b.budget_inr)} · excludes GST and approvals` : 'Enter an amount in rupees'} placeholder="e.g. 4000000" />
            <Segmented label="Finish level" value={b.tier} onChange={(v) => set('tier', v)}
              options={(['economy', 'standard', 'premium'] as const).map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1), sub: TIER_HINT[t] }))} />
            <TextArea label="In your own words (optional)" rows={5} value={b.free_text} onChange={(v) => set('free_text', v)}
              placeholder="e.g. My mother has knee pain and can't climb stairs. We cook a lot of non-veg, so a closed kitchen. Strict Vaastu for the puja and kitchen."
              hint="English, Hindi or Hinglish. Don't include names or phone numbers." />
            <button type="button" onClick={readWords} disabled={busy || !b.free_text.trim()}
              className="inline-flex items-center gap-2 rounded-lg border border-sage-700 bg-white px-4 py-2 text-sm font-semibold text-sage-800 hover:bg-sage-50 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Read my words
            </button>
            {extracted && (
              <ExtractPanel extracted={extracted} onApply={() => { setB((x) => ({ ...x, ...extracted.fields })); setExtracted(null); }} onDismiss={() => setExtracted(null)} />
            )}
          </div>
        )}

        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:invisible">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !plotOk}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sage-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-900 disabled:opacity-50">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sage-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-900 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {outsidePilot ? 'Continue' : 'Review my brief'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{sub}</p>
    </div>
  );
}

const FIELD_LABEL: Record<string, string> = {
  elders: 'Elders', elder_mobility_issue: 'Finds stairs hard', kids: 'Children', pets: 'Pets', wfh_people: 'Work from home',
  joint_family: 'Joint family', rental_floor: 'Rental floor', puja: 'Puja', parking: 'Parking', floors_wanted: 'Floors', traditions: 'Traditions', styles: 'Styles',
  plot_width_ft: 'Plot width (ft)', plot_depth_ft: 'Plot depth (ft)', facing: 'Plot faces', corner_plot: 'Corner plot', lift: 'Lift',
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
    <div className="rounded-xl border border-sage-200 bg-sage-50 p-4">
      <p className="text-sm font-semibold text-sage-900">{entries.length ? 'From your words we picked up:' : "We couldn't pick out anything specific; the form above still counts."}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-800">
        {entries.map(([k, v]) => (
          <li key={k}>
            <strong>{FIELD_LABEL[k] ?? k}:</strong> {humanize(v)}
            {extracted.evidence[k] && <span className="text-slate-500"> — “{extracted.evidence[k]}”</span>}
          </li>
        ))}
      </ul>
      {extracted.questions.length > 0 && (
        <div className="mt-3 text-sm text-slate-700">
          <p className="font-semibold">Worth clarifying:</p>
          <ul className="list-disc pl-5">{extracted.questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {entries.length > 0 && <button type="button" onClick={onApply} className="rounded-lg bg-sage-800 px-3 py-1.5 text-sm font-semibold text-white">Apply to my answers</button>}
        <button type="button" onClick={onDismiss} className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-white">Dismiss</button>
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
    <section className="mx-auto max-w-2xl rounded-2xl bg-ivory-50 p-6 text-slate-900 shadow-xl sm:p-8">
      <h1 className="text-2xl font-bold">Here&apos;s what we understood</h1>
      <ul className="mt-4 space-y-2">
        {understood.map((s) => <li key={s} className="flex gap-2 text-slate-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-700" />{s}</li>)}
      </ul>
      {waitlist ? (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="flex items-center gap-2 font-semibold text-amber-900"><MapPin className="h-4 w-4" />
            {waitlist === 'city' ? 'Nestora is in pilot for Mumbai only.' : 'Renovations and flat interiors are coming soon.'}</p>
          {joined ? <p className="mt-2 text-sm text-amber-900">You&apos;re on the list. We&apos;ll email you once.</p> : (
            <form onSubmit={join} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label htmlFor="wl" className="sr-only">Email</label>
              <input id="wl" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
              <button className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white">Join the waitlist</button>
            </form>
          )}
          {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}
          {waitlist === 'city' && <p className="mt-3 text-xs text-amber-900">You can still see a design using Mumbai rules below.</p>}
        </div>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={onEdit} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Change answers</button>
        {(!waitlist || waitlist === 'city') && (
          <>
            {!brief.styles_locked && <button type="button" onClick={() => onNext(true)} className="rounded-lg bg-sage-800 px-4 py-2 text-sm font-semibold text-white">Find my style (1 min swipe)</button>}
            <button type="button" onClick={() => onNext(false)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${brief.styles_locked ? 'bg-sage-800 text-white' : 'border border-sage-800 text-sage-800'}`}>
              {brief.styles_locked ? 'See 4 layout options' : 'Skip to layouts'}
            </button>
          </>
        )}
      </div>
      <p className="mt-4 font-mono text-xs text-slate-400">House {houseId}</p>
    </section>
  );
}
