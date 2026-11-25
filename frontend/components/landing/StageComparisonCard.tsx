'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldVerifiedIcon, ArrowFolioRightIcon } from './BespokeIcons';

export interface StageData {
  id: string;
  stageNum: string;
  stageTag: string;
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

export default function StageComparisonCard({ data }: { data: StageData }) {
  return (
    <article className="w-full bg-white rounded-2xl md:rounded-3xl border border-stone-border p-5 md:p-6 shadow-xl flex flex-col justify-between max-h-[min(510px,68vh)] overflow-y-auto space-y-4">
      {/* Header & Metric Tag */}
      <div className="space-y-1.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-champagne bg-ivory-100 px-2.5 py-1 rounded-full border border-stone-border">
            {data.stageNum} • {data.stageTag}
          </span>
          <span className="text-xs font-mono font-bold text-sage-900 bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-200">
            {data.primaryMetric}
          </span>
        </div>

        <h2 className="text-lg md:text-2xl font-black text-sage-900 tracking-tight leading-snug pt-0.5">
          {data.h2Title}
        </h2>
        <p className="text-xs text-stone-muted leading-relaxed line-clamp-2 md:line-clamp-none">
          {data.seoSubtitle}
        </p>
      </div>

      {/* The Comparison Matrix: Old Way vs Nestora Way */}
      <div className="space-y-2.5 flex-1">
        {/* The Old Way (Traditional Friction) */}
        <div className="bg-red-50/60 rounded-xl p-3 border border-red-200/80 space-y-1">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-red-900">
            <span className="w-3.5 h-3.5 rounded-full bg-red-200 text-red-800 flex items-center justify-center text-[9px] flex-shrink-0">✕</span>
            <span>Traditional: {data.oldWayTitle}</span>
          </div>
          <ul className="space-y-0.5 pl-5 text-[11px] text-red-800/90 list-disc">
            {data.oldWayPoints.map((point, idx) => (
              <li key={idx} className="leading-snug">{point}</li>
            ))}
          </ul>
        </div>

        {/* The Nestora Way (Deterministic AI Studio) */}
        <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-300 space-y-1">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-950">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[9px] flex-shrink-0">✓</span>
            <span>Nestora: {data.nestoraTitle}</span>
          </div>
          <ul className="space-y-0.5 pl-5 text-[11px] text-emerald-900 list-disc">
            {data.nestoraPoints.map((point, idx) => (
              <li key={idx} className="leading-snug">{point}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer / Action */}
      <div className="pt-2 border-t border-stone-border flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center space-x-1.5 text-[11px] text-sage-800 font-medium">
          <ShieldVerifiedIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="truncate">{data.metricLabel}</span>
        </div>

        {data.ctaText && data.ctaLink && (
          <Link
            href={data.ctaLink}
            className="inline-flex items-center space-x-1.5 bg-sage-900 hover:bg-black text-ivory-50 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md hover:shadow-lg flex-shrink-0"
          >
            <span>{data.ctaText}</span>
            <ArrowFolioRightIcon className="w-3 h-3" />
          </Link>
        )}
      </div>
    </article>
  );
}
