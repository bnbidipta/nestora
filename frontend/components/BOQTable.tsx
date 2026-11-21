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

// ponytail: typical Indian payout split, not computed per project. Replaced by phased BOQ in Phase C.
const STAGES = [
  { name: 'Foundation & plinth', pct: 0.2 },
  { name: 'Columns, beams & slabs', pct: 0.35 },
  { name: 'Masonry & concealed MEP', pct: 0.25 },
  { name: 'Finishing & handover', pct: 0.2 },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

export default function BOQTable({ twin }: { twin: HouseTwin }) {
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [loanPct, setLoanPct] = useState(80);

  const { boq, budget } = twin;
  const total = boq.total_cost_inr;
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

  const input = 'rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#131926] p-5">
          <span className="font-mono text-xs text-slate-400">ESTIMATED CONSTRUCTION COST</span>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{formatINR(total)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {area > 0
              ? `${formatINR(total / area)} per sqft over ${area.toLocaleString('en-IN')} sqft built-up`
              : 'No floors generated'}
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
            <label className="flex flex-col gap-1 text-slate-400">
              Loan %
              <input type="number" min={0} max={90} value={loanPct} onChange={(e) => setLoanPct(clamp(Number(e.target.value), 0, 90))} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-slate-400">
              Rate %
              <input type="number" min={0} max={20} step={0.1} value={rate} onChange={(e) => setRate(clamp(Number(e.target.value), 0, 20))} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-slate-400">
              Years
              <input type="number" min={1} max={30} value={years} onChange={(e) => setYears(clamp(Number(e.target.value), 1, 30))} className={input} />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-[#131926] p-6">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-white">
            <Coins className="h-4 w-4 text-blue-400" aria-hidden /> Cost breakdown
          </h2>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {Object.entries(boq.cost_breakdown).map(([k, v]) => (
                <tr key={k}>
                  <td className="py-2 capitalize">{k.replace(/_/g, ' ')}</td>
                  <td className="py-2 text-right">{formatINR(v)}</td>
                  <td className="py-2 pl-3 text-right text-slate-500">{total > 0 ? `${Math.round((v / total) * 100)}%` : ''}</td>
                </tr>
              ))}
              <tr className="font-bold text-white">
                <td className="py-2">Total</td>
                <td className="py-2 text-right text-emerald-400">{formatINR(total)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#131926] p-6">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-white">
            <FileSpreadsheet className="h-4 w-4 text-blue-400" aria-hidden /> Material quantities
          </h2>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {quantities.map(([k, v]) => (
                <tr key={k}>
                  <td className="py-2">{k}</td>
                  <td className="py-2 text-right">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-[#131926] p-6">
        <h2 className="mb-1 font-mono text-sm font-bold uppercase tracking-wider text-white">Typical payment stages</h2>
        <p className="mb-4 text-xs text-slate-400">A common split for Indian residential builds. Your contractor&apos;s schedule will differ.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {STAGES.map((s) => (
            <div key={s.name} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="font-mono text-xs text-slate-500">{Math.round(s.pct * 100)}%</span>
              <p className="mt-1 text-sm font-bold text-white">{s.name}</p>
              <p className="mt-2 font-mono text-xs text-blue-400">{formatINR(total * s.pct)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
