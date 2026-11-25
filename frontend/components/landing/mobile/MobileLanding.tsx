import ScrollVideo from '@/components/landing/ScrollVideo';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StageData } from '../StageComparisonCard';
import { CompassRoseIcon, ArrowFolioRightIcon, ShieldVerifiedIcon } from '../BespokeIcons';

import { STAGES_DATA } from '../UnifiedHorizontalStack';


// Map stages to responsive image base paths
const STAGE_IMAGES: Record<string, { base: string; alt: string }> = {
  overview: {
    base: '/images/home/optimised/hero_dusk_courtyard',
    alt: 'Nestora modern residential concept house at twilight featuring landscaped courtyard'
  },
  plot: {
    base: '/images/home/optimised/garden_suite',
    alt: 'Sunlit ground-floor garden suite with natural greenery and architectural boundary setbacks'
  },
  blueprint: {
    base: '/images/home/optimised/living_courtyard',
    alt: 'Living area oriented around a central open-to-sky courtyard with natural cross-ventilation'
  },
  structure: {
    base: '/images/home/optimised/wfh_studio',
    alt: 'Architectural structural framing with concealed columns and high ceilings'
  },
  enclosure: {
    base: '/images/home/optimised/hero_dusk_courtyard',
    alt: 'Tropical modern house exterior with deep weather overhangs and breathable wood screens'
  },
  finishes: {
    base: '/images/home/optimised/tactile_materials',
    alt: 'Flatlay of tactile residential construction materials including stone, brass, timber, and concrete'
  }
};

export default function MobileLanding() {
  const stages: StageData[] = STAGES_DATA;

  return (
    <div className="w-full min-h-screen bg-ivory-100 text-sage-900 font-sans selection:bg-sage-800 selection:text-ivory-50 pb-16">
      {/* Sticky Mobile Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-ivory-100/95 backdrop-blur-md border-b border-stone-border">
        <div className="flex items-center space-x-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={30} height={30} className="h-[30px] w-[30px]" />
          <div>
            <span className="text-base font-black tracking-tight text-sage-900 block leading-tight">NESTORA</span>
            <span className="text-[8px] uppercase tracking-widest text-stone-muted block">Autonomous Architecture</span>
          </div>
        </div>

        <Link
          href="/questionnaire"
          className="bg-sage-900 text-ivory-50 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-sage-800 focus:ring-offset-2 transition-colors flex items-center space-x-1"
        >
          <span>Design</span>
          <ArrowFolioRightIcon className="w-3 h-3" />
        </Link>
      </header>

      {/* Main Single-Column Stack */}
      <ScrollVideo src="/video/hero.mp4" poster="/video/hero-poster.jpg" cta={{ href: '/questionnaire', text: 'Design my home' }}>
        <h2 className="max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-6xl">Your family. Your plot.<br />A home that fits.</h2>
        <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">Answer a few questions. Get a house design that follows the building rules, a cost estimate, and a walk-through in 3D.</p>
      </ScrollVideo>
      <main className="px-4 py-6 space-y-12 max-w-lg mx-auto">
        {/* Semantic H1 & Hero Intro */}
        <section className="space-y-4 text-left pt-2">
          <div className="inline-flex items-center space-x-2 text-[11px] font-mono font-bold text-champagne bg-white px-3 py-1 rounded-full border border-stone-border">
            <CompassRoseIcon className="w-3.5 h-3.5 text-champagne" />
            <span>MUMBAI PILOT • 30×40 G+1</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-sage-900 tracking-tight leading-tight">
            NESTORA: Autonomous Residential Architectural Intelligence
          </h1>

          <p className="text-sm sm:text-base text-stone-muted leading-relaxed">
            From plot contours to an itemized cost estimate in minutes. We generate complete concept 2D blueprints, 3D structural frames, and quantity takeoffs for small plots—ready to take to a licensed architect.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/questionnaire"
              className="w-full bg-sage-900 text-ivory-50 text-center py-3 rounded-xl font-bold text-sm tracking-wide shadow-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-sage-800 focus:ring-offset-2 transition-all flex items-center justify-center space-x-2"
            >
              <span>Start Free Questionnaire</span>
              <ArrowFolioRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/house/nest_f24390ae0f"
              className="w-full bg-white text-sage-900 text-center py-3 rounded-xl font-bold text-sm border border-stone-border hover:bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-sage-800 focus:ring-offset-2 transition-all"
            >
              See a sample home
            </Link>
          </div>
        </section>

        {/* 6-Section Story Sequence (Overview + 5 Stages) */}
        {stages.map((stage, idx) => {
          const imgMeta = STAGE_IMAGES[stage.id] || STAGE_IMAGES.overview;
          const isAboveFold = idx === 0;

          return (
            <section
              key={stage.id}
              id={`stage-${stage.id}`}
              className="bg-white rounded-2xl border border-stone-border overflow-hidden shadow-sm space-y-4 p-4 sm:p-5"
            >
              {/* Responsive Image with Picture element for WebP/AVIF */}
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-ivory-200 border border-stone-border">
                <picture>
                  <source
                    type="image/avif"
                    srcSet={`${imgMeta.base}-640.avif 640w, ${imgMeta.base}-1080.avif 1080w, ${imgMeta.base}-1600.avif 1600w`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 600px"
                  />
                  <source
                    type="image/webp"
                    srcSet={`${imgMeta.base}-640.webp 640w, ${imgMeta.base}-1080.webp 1080w, ${imgMeta.base}-1600.webp 1600w`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 600px"
                  />
                  <Image
                    src={`${imgMeta.base}-1080.webp`}
                    alt={imgMeta.alt}
                    fill
                    className="object-cover"
                    priority={isAboveFold}
                    loading={isAboveFold ? 'eager' : 'lazy'}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 600px"
                  />
                </picture>
              </div>

              {/* Tag & Metric Badges */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-champagne bg-ivory-100 px-2.5 py-0.5 rounded-full border border-stone-border">
                  {stage.stageNum} • {stage.stageTag}
                </span>
                <span className="text-[11px] font-mono font-bold text-sage-900 bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200">
                  {stage.primaryMetric}
                </span>
              </div>

              {/* Title & Copy */}
              <div className="space-y-1.5">
                <h2 className="text-lg sm:text-xl font-bold text-sage-900 tracking-tight leading-snug">
                  {stage.h2Title}
                </h2>
                <p className="text-xs sm:text-sm text-stone-muted leading-relaxed">
                  {stage.seoSubtitle}
                </p>
              </div>

              {/* Before vs After Comparative Breakdown */}
              <div className="space-y-3 pt-2">
                {/* Traditional Method */}
                <div className="p-3 rounded-xl bg-ivory-50 border border-stone-border space-y-1.5">
                  <div className="text-[11px] font-bold text-stone-muted uppercase tracking-wider">
                    Traditional Method: {stage.oldWayTitle}
                  </div>
                  <ul className="space-y-1">
                    {stage.oldWayPoints.map((pt, pIdx) => (
                      <li key={pIdx} className="text-xs text-stone-muted flex items-start space-x-1.5">
                        <span className="text-rose-500 font-bold leading-none mt-0.5">✕</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Nestora Synthesis */}
                <div className="p-3 rounded-xl bg-sage-50/80 border border-sage-200 space-y-1.5">
                  <div className="text-[11px] font-bold text-sage-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldVerifiedIcon className="w-3.5 h-3.5 text-sage-700" />
                    <span>Nestora Synthesis: {stage.nestoraTitle}</span>
                  </div>
                  <ul className="space-y-1">
                    {stage.nestoraPoints.map((pt, pIdx) => (
                      <li key={pIdx} className="text-xs text-sage-900 flex items-start space-x-1.5">
                        <span className="text-emerald-600 font-bold leading-none mt-0.5">✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              {stage.ctaLink && (
                <div className="pt-2">
                  <Link
                    href={stage.ctaLink}
                    className="w-full block text-center py-2.5 rounded-xl bg-sage-900 text-ivory-50 font-bold text-xs tracking-wide hover:bg-black focus:outline-none focus:ring-2 focus:ring-sage-800 focus:ring-offset-2 transition-colors"
                  >
                    {stage.ctaText || 'Learn More'}
                  </Link>
                </div>
              )}
            </section>
          );
        })}

        {/* Disclaimer Note (Institutional Honesty) */}
        <section className="p-4 rounded-xl bg-ivory-200/80 border border-stone-border text-xs text-stone-muted space-y-1.5">
          <p className="font-bold text-sage-900">Important Professional Notice:</p>
          <p className="leading-relaxed">
            All floor plans, 3D structural twin frameworks, and cost quantity takeoffs generated by Nestora represent preliminary concept designs and estimates. They must be reviewed, adapted, and approved by a licensed architect and structural engineer registered with the relevant authorities before commencing construction or filing for municipal permits.
          </p>
        </section>
      </main>
      <ScrollVideo src="/video/walkthrough.mp4" poster="/video/walkthrough-poster.jpg" cta={{ href: '/house/nest_f24390ae0f', text: 'Walk through a sample home' }}>
        <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight md:text-5xl">Walk through your home before a single brick is laid.</h2>
        <p className="mt-3 max-w-xl text-white/85">Every design opens in 3D: look around, walk room to room, and watch the light move from morning to night.</p>
      </ScrollVideo>

      {/* Semantic Footer */}
      <footer className="mt-8 px-4 py-6 border-t border-stone-border text-center text-xs text-stone-muted space-y-2">
        <p className="font-bold text-sage-900 tracking-wider">NESTORA ARCHITECTURAL INTELLIGENCE</p>
        <p className="text-[11px]">Phase 1 Mumbai Pilot • Autonomous Residential Synthesis</p>
      </footer>
    </div>
  );
}
