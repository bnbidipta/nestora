'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldVerifiedIcon, ArrowFolioRightIcon } from './BespokeIcons';

export interface BenefitData {
  id: string;
  folioNum: string;
  themeTag: string;
  h2Title: string;
  seoSubtitle: string;
  oldWayTitle: string;
  oldWayPoints: string[];
  nestoraTitle: string;
  nestoraPoints: string[];
  primaryMetric: string;
  metricLabel: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function BenefitComparisonCard({ data }: { data: BenefitData }) {
  return (
    <article className="w-full bg-white/95 backdrop-blur-xl rounded-3xl border border-stone-border p-6 md:p-8 shadow-2xl flex flex-col justify-between space-y-6">
      {/* Top Header & Tag */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-champagne bg-ivory-100 px-3 py-1 rounded-full border border-stone-border">
            {data.folioNum} • {data.themeTag}
          </span>
          <span className="text-xs font-mono font-bold text-sage-900 bg-sage-50 px-3 py-1 rounded-full border border-sage-200">
            {data.primaryMetric}
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-sage-900 tracking-tight leading-tight pt-1">
          {data.h2Title}
        </h2>
        <p className="text-xs md:text-sm text-stone-muted leading-relaxed">
          {data.seoSubtitle}
        </p>
      </div>

      {/* The Comparison Matrix: Old Way vs Nestora Way */}
      <div className="space-y-3">
        {/* The Old Way (Traditional) */}
        <div className="bg-red-50/50 rounded-2xl p-4 border border-red-200/70 space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-red-900">
            <span className="w-4 h-4 rounded-full bg-red-200 text-red-800 flex items-center justify-center text-[10px]">✕</span>
            <span>The Traditional Way: {data.oldWayTitle}</span>
          </div>
          <ul className="space-y-1 pl-6 text-[11px] text-red-800/90 list-disc">
            {data.oldWayPoints.map((point, idx) => (
              <li key={idx} className="leading-snug">{point}</li>
            ))}
          </ul>
        </div>

        {/* The Nestora Way (AI Architectural Platform) */}
        <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-300 space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-950">
            <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px]">✓</span>
            <span>The Nestora Way: {data.nestoraTitle}</span>
          </div>
          <ul className="space-y-1 pl-6 text-[11px] text-emerald-900 list-disc">
            {data.nestoraPoints.map((point, idx) => (
              <li key={idx} className="leading-snug">{point}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Card Footer / Action */}
      <div className="pt-2 border-t border-stone-border flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-[11px] text-sage-800 font-medium">
          <ShieldVerifiedIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>{data.metricLabel}</span>
        </div>

        {data.ctaText && data.ctaLink && (
          <Link
            href={data.ctaLink}
            className="inline-flex items-center space-x-1.5 bg-sage-900 hover:bg-black text-ivory-50 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md hover:shadow-lg"
          >
            <span>{data.ctaText}</span>
            <ArrowFolioRightIcon className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}
