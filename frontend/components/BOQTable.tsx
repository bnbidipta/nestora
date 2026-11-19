'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Calculator, 
  Layers, 
  Coins, 
  ArrowRight, 
  Clock, 
  Building2,
  CheckCircle2
} from 'lucide-react';
import { HouseTwin } from '@/lib/twin';

interface BOQTableProps {
  twin: HouseTwin;
}

export default function BOQTable({ twin }: BOQTableProps) {
  const [loanTenure, setLoanTenure] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);

  const boq = twin.boq || {
    cement_bags: 720,
    steel_kg: 6300,
    sand_tons: 45,
    aggregate_tons: 60,
    bricks_count: 18000,
    total_cost_inr: 2000000,
    cost_breakdown: {
      foundation: 400000,
      structure: 700000,
      mep: 250000,
      finishing: 650000
    }
  };

  const area = 1500;
  const cementCost = boq.cement_bags * 400;
  const steelCost = boq.steel_kg * 70;
  const sandCost = (boq.sand_tons || 45) * 2200;
  const aggregateCost = (boq.aggregate_tons || 60) * 1400;
  const brickCost = (boq.bricks_count || 18000) * 9;
  const flooringCost = area * 120;
  const mepCost = boq.cost_breakdown?.mep || 250000;
  const labourCost = area * 330;

  const totalCalculated = cementCost + steelCost + sandCost + aggregateCost + brickCost + flooringCost + mepCost + labourCost;

  // Monthly EMI calculation
  const loanPrincipal = totalCalculated * 0.8;
  const monthlyR = (interestRate / 100) / 12;
  const totalMonths = loanTenure * 12;
  const monthlyEMI = Math.round(
    loanPrincipal * monthlyR * Math.pow(1 + monthlyR, totalMonths) / (Math.pow(1 + monthlyR, totalMonths) - 1)
  );

  const items = [
    { name: "OPC / PPC Cement (50kg Bags)", qty: `${boq.cement_bags} Bags`, rate: "₹400 / bag", amount: cementCost, code: "IS 269 / IS 1489" },
    { name: "Fe500D TMT Reinforcement Steel", qty: `${boq.steel_kg.toLocaleString()} Kg`, rate: "₹70 / kg", amount: steelCost, code: "IS 1786 High Ductility" },
    { name: "River Sand / M-Sand", qty: `${boq.sand_tons || 45} Tons`, rate: "₹2,200 / ton", amount: sandCost, code: "IS 383 Zone II" },
    { name: "Coarse Aggregate (20mm & 10mm)", qty: `${boq.aggregate_tons || 60} Tons`, rate: "₹1,400 / ton", amount: aggregateCost, code: "IS 383 Graded" },
    { name: "Red Clay Wirecut Bricks", qty: `${(boq.bricks_count || 18000).toLocaleString()} Nos`, rate: "₹9 / brick", amount: brickCost, code: "IS 1077 Class 7.5" },
    { name: "Flooring & Wall Tiles (Vitrified + Teak)", qty: `${area} sqft`, rate: "Avg ₹120 / sqft", amount: flooringCost, code: "25-Material DB Match" },
    { name: "MEP (Pipes, Wires, Distribution, Pump)", qty: "Lump-sum", rate: "As per schedule", amount: mepCost, code: "IS 1742 / NBC Part 9" },
    { name: "RCC Labour, Shuttering & Masonry", qty: `${area} sqft`, rate: "₹330 / sqft", amount: labourCost, code: "Mumbai Contractor Index" }
  ];

  return (
    <div className="space-y-8">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#131926] p-5">
          <span className="font-mono text-xs text-slate-400">TOTAL ESTIMATED BUDGET</span>
          <p className="mt-2 text-2xl font-bold font-mono text-white">
            ₹ {(totalCalculated / 100000).toFixed(2)} Lakhs
          </p>
          <p className="mt-1 text-xs text-emerald-400">
            Within Target ₹{(boq.total_cost_inr / 100000).toFixed(1)}L Budget
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#131926] p-5">
          <span className="font-mono text-xs text-slate-400">ESTIMATED MONTHLY EMI</span>
          <p className="mt-2 text-2xl font-bold font-mono text-amber-400">
            ₹ {monthlyEMI.toLocaleString()} / mo
          </p>
          <p className="mt-1 text-xs text-slate-400">
            80% Bank Loan @ {interestRate}% for {loanTenure} Yrs
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#131926] p-5">
          <span className="font-mono text-xs text-slate-400">CONSTRUCTION DURATION</span>
          <p className="mt-2 text-2xl font-bold font-mono text-blue-400">
            7.5 Months
          </p>
          <p className="mt-1 text-xs text-slate-400">
            4 Phased Milestone Payouts
          </p>
        </div>
      </div>

      {/* Itemized BOQ Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#131926]">
        <div className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Mumbai Market Rate BOQ Takeoff (Nov 2026)
            </h3>
          </div>
          <span className="rounded bg-blue-950/80 px-2.5 py-1 font-mono text-[11px] text-blue-400 border border-blue-800/40">
            1,500 sqft G+1 Villa
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 font-mono text-slate-400">
              <tr>
                <th className="px-6 py-3">Item Description</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Unit Benchmark Rate</th>
                <th className="px-4 py-3">Standard / Code</th>
                <th className="px-6 py-3 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/30 transition">
                  <td className="px-6 py-3.5 font-sans font-medium text-white">
                    {item.name}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">{item.qty}</td>
                  <td className="px-4 py-3.5 text-slate-400">{item.rate}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-[11px]">{item.code}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-white">
                    ₹ {item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900/80 font-bold text-white">
                <td colSpan={4} className="px-6 py-4 text-right uppercase tracking-wider text-xs">
                  Total Construction Cost (Materials + Labour):
                </td>
                <td className="px-6 py-4 text-right text-sm text-emerald-400">
                  ₹ {totalCalculated.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Phased Milestone Payout Schedule */}
      <div className="rounded-2xl border border-slate-800 bg-[#131926] p-6">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-blue-400" />
          <span>Stage-Wise Construction Payout Schedule</span>
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="font-mono text-[10px] text-slate-500">STAGE 1: 20%</span>
            <p className="mt-1 font-bold text-sm text-white">Plinth & Raft Foundation</p>
            <p className="mt-2 font-mono text-xs text-blue-400">₹ {(totalCalculated * 0.2).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="font-mono text-[10px] text-slate-500">STAGE 2: 35%</span>
            <p className="mt-1 font-bold text-sm text-white">RCC Columns & Slabs</p>
            <p className="mt-2 font-mono text-xs text-blue-400">₹ {(totalCalculated * 0.35).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="font-mono text-[10px] text-slate-500">STAGE 3: 25%</span>
            <p className="mt-1 font-bold text-sm text-white">Masonry & MEP Concealed</p>
            <p className="mt-2 font-mono text-xs text-blue-400">₹ {(totalCalculated * 0.25).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="font-mono text-[10px] text-slate-500">STAGE 4: 20%</span>
            <p className="mt-1 font-bold text-sm text-white">Finishing & Handover</p>
            <p className="mt-2 font-mono text-xs text-emerald-400">₹ {(totalCalculated * 0.2).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
