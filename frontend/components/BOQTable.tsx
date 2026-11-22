'use client';

import { useState } from 'react';
import { FileSpreadsheet, Coins } from 'lucide-react';
import { HouseTwin, builtUpSqft, formatINR } from '@/lib/twin';

/** Standard amortised EMI. Returns 0 for a zero principal or zero tenure instead of dividing by zero. */
export function emi(principal: number, annualRatePct: number, years: number): number {
  const n = years * 12;
  if (principal <= 0 || n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

type Tier = 'economy' | 'standard' | 'premium';
type Range = Record<'low' | 'expected' | 'high', Record<string, number>>;
type BoqInfo = { tiers: Record<Tier, Range>; rates_as_of: string; gst_note?: string };

// Payment stages built from this house's own cost lines.
const STAGES: { name: string; keys: string[] }[] = [
  { name: 'Foundation & plinth', keys: ['foundation'] },
  { name: 'Columns, beams & slabs', keys: ['structure'] },
  { name: 'Masonry, plaster & concealed MEP', keys: ['masonry_plaster', 'mep'] },
  { name: 'Finishing & handover', keys: ['finishing', 'contingency'] },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

export default function BOQTable({ twin }: { twin: HouseTwin }) {
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [loanPct, setLoanPct] = useState(80);
  const info = (twin.metadata?.boq ?? null) as BoqInfo | null;
  const briefTier = ((twin.metadata?.brief ?? {}) as { tier?: Tier }).tier;
  const [tier, setTier] = useState<Tier>(briefTier ?? 'standard');

  const { boq, budget } = twin;
  const range = info?.tiers?.[tier];
  const lines: Record<string, number> = range ? range.expected : boq.cost_breakdown;
  const total = range ? range.expected.total : boq.total_cost_inr;
  const area = builtUpSqft(twin);
  const overBudget = total - budget.total_budget_inr;
  const monthly = emi((total * loanPct) / 100, rate, years);

  const quantities: [string, string][] = [
    ['Cement (50 kg bags)', `${boq.cement_bags.toLocaleString('en-IN')} bags`],
    ['Steel reinforcement', `${boq.steel_kg.toLocaleString('en-IN')} kg`],
    ['Sand', boq.sand_tons != null ? `${boq.sand_tons} t` : '—'],
    ['Aggregate', boq.aggregate_tons != null ? `${boq.aggregate_tons} t` : '—'],
    ['Bricks', boq.bricks_count != null ? boq.bricks_count.toLocaleString('en-IN') : '—'],
  ];
  const input = 'rounded border border-slate-600 bg-slate-950 px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#131926] p-5">
          <span className="font-mono text-xs text-slate-400">ESTIMATED CONSTRUCTION COST</span>
          <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Finish level">
            {(['economy', 'standard', 'premium'] as Tier[]).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={t === tier} onClick={() => setTier(t)} disabled={!info}
                className={`rounded px-2 py-0.5 font-mono text-[11px] capitalize ${t === tier ? 'bg-white text-slate-900' : 'border border-slate-700 text-slate-300'}`}>{t}</button>
            ))}
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{formatINR(total)}</p>
          {range && <p className="text-xs text-slate-400">Range {formatINR(range.low.total)} – {formatINR(range.high.total)}</p>}
          <p className="mt-1 text-xs text-slate-400">
            {area > 0 ? `${formatINR(total / area)} per sqft over ${area.toLocaleString('en-IN')} sqft` : 'No floors generated'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#131926] p-5">
          <span className="font-mono text-xs text-slate-400">YOUR BUDGET</span>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{formatINR(budget.total_budget_inr)}</p>
          <p className={`mt-1 text-xs ${overBudget > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {overBudget > 0 ? `${formatINR(overBudget)} over budget` : `${formatINR(-overBudget)} under budget`}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#131926] p-5">
          <span className="font-mono text-xs text-slate-400">ESTIMATED MONTHLY EMI</span>
          <p className="mt-2 font-mono text-2xl font-bold text-amber-400">{formatINR(monthly)} / mo</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <label className="flex flex-col gap-1 text-slate-300">Loan %
              <input type="number" min={0} max={90} value={loanPct} onChange={(e) => setLoanPct(clamp(Number(e.target.value), 0, 90))} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-slate-300">Rate %
              <input type="number" min={0} max={20} step={0.1} value={rate} onChange={(e) => setRate(clamp(Number(e.target.value), 0, 20))} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-slate-300">Years
              <input type="number" min={1} max={30} value={years} onChange={(e) => setYears(clamp(Number(e.target.value), 1, 30))} className={input} />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-[#131926] p-6">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-white">
            <Coins className="h-4 w-4 text-blue-400" aria-hidden /> Cost breakdown ({tier})
          </h2>
          <table className="w-full text-left text-sm">
            {range && (
              <thead><tr className="text-xs text-slate-500"><th /><th className="py-1 text-right font-normal">Low</th><th className="py-1 text-right font-normal">Expected</th><th className="py-1 text-right font-normal">High</th></tr></thead>
            )}
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {Object.entries(lines).filter(([k]) => k !== 'total').map(([k, v]) => (
                <tr key={k}>
                  <td className="py-2 capitalize">{k.replace(/_/g, ' ')}</td>
                  {range && <td className="py-2 text-right text-slate-500">{formatINR(range.low[k])}</td>}
                  <td className="py-2 text-right">{formatINR(v)}</td>
                  {range && <td className="py-2 text-right text-slate-500">{formatINR(range.high[k])}</td>}
                </tr>
              ))}
              <tr className="font-bold text-white">
                <td className="py-2">Total</td>
                {range && <td className="py-2 text-right">{formatINR(range.low.total)}</td>}
                <td className="py-2 text-right text-emerald-400">{formatINR(total)}</td>
                {range && <td className="py-2 text-right">{formatINR(range.high.total)}</td>}
              </tr>
            </tbody>
          </table>
          {info && <p className="mt-3 text-xs text-slate-500">Rates as of {info.rates_as_of} (Mumbai, unverified draft), excluding GST. {info.gst_note}</p>}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#131926] p-6">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-white">
            <FileSpreadsheet className="h-4 w-4 text-blue-400" aria-hidden /> Material quantities
          </h2>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {quantities.map(([k, v]) => (
                <tr key={k}><td className="py-2">{k}</td><td className="py-2 text-right">{v}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">Thumb-rule quantities per sqft of built-up area; a quantity surveyor refines these from drawings.</p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-[#131926] p-6">
        <h2 className="mb-1 font-mono text-sm font-bold uppercase tracking-wider text-white">Payment stages</h2>
        <p className="mb-4 text-xs text-slate-400">From this estimate&apos;s own cost lines. Your contractor&apos;s schedule will differ.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {STAGES.map((s) => {
            const amt = s.keys.reduce((a, k) => a + (lines[k] ?? 0), 0);
            return (
              <div key={s.name} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="font-mono text-xs text-slate-500">{total > 0 ? Math.round((amt / total) * 100) : 0}%</span>
                <p className="mt-1 text-sm font-bold text-white">{s.name}</p>
                <p className="mt-2 font-mono text-xs text-blue-400">{formatINR(amt)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
