'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import ProgressiveStageCanvas from './ProgressiveStageCanvas';
import StageComparisonCard, { StageData } from './StageComparisonCard';
import { CompassRoseIcon, ArrowFolioLeftIcon, ArrowFolioRightIcon } from './BespokeIcons';

export const STAGES_DATA: StageData[] = [
  {
    id: 'overview',
    stageNum: 'OVERVIEW',
    stageTag: 'PLATFORM ARCHITECTURE',
    h2Title: 'The Architect In Your Pocket: From Bare Plot to Keys in Hand',
    seoSubtitle: 'Generate complete 30×40 G+1 residential house plans with a structural concept, automated rule checks and an itemized cost estimate in minutes, ready to take to a licensed architect.',
    oldWayTitle: '6-Month Traditional Architectural Delays',
    oldWayPoints: [
      '6 to 9 months of drafting meetings and slow revisions.',
      'Fragmented coordination between architect, structural, and MEP consultants.'
    ],
    nestoraTitle: 'Autonomous Multi-Model Synthesis',
    nestoraPoints: [
      'A concept House Twin (2D plan, 3D structure, MEP) in minutes.',
      'Deterministic rule-based models compute every number; a licensed architect reviews before you build.'
    ],
    primaryMetric: 'Minutes, not months',
    metricLabel: 'Concept design from plot to estimate',
    ctaText: 'Start Questionnaire',
    ctaLink: '/questionnaire'
  },
  {
    id: 'plot',
    stageNum: 'STAGE 01',
    stageTag: 'SITE SURVEY & SETBACKS',
    h2Title: 'Instant AI Plot Clearance vs. 3-Month Municipal Confusion',
    seoSubtitle: 'Deterministic setback enforcement and road frontage analysis eliminate municipal plan rejections.',
    oldWayTitle: 'Manual Bylaw Confusion',
    oldWayPoints: [
      'Masons and draftsmen guessing municipal setbacks, leading to stop-work notices.',
      'Costly redesign penalties and months lost in municipal approval delays.'
    ],
    nestoraTitle: 'Algorithmic Envelope Verification',
    nestoraPoints: [
      'Instant setback and buildable-area calculation for your plot size.',
      'Sun-path, wind direction and soil assumptions stated up front, before drafting.'
    ],
    primaryMetric: 'Rules checked automatically',
    metricLabel: 'Municipal Setback & Envelope Math',
    ctaText: 'Verify Your Plot',
    ctaLink: '/questionnaire'
  },
  {
    id: 'blueprint',
    stageNum: 'STAGE 02',
    stageTag: '2D CAD BLUEPRINT',
    h2Title: 'Floor Plans Fitted to Your Family vs. Recycled Catalog Templates',
    seoSubtitle: 'No cookie-cutter templates. Dynamic constraint graphs synthesize sunlight, family mobility, and daily routines.',
    oldWayTitle: 'Recycled Template Catalogs',
    oldWayPoints: [
      'Pre-drawn generic floor plans stamped onto your plot with dark internal corridors.',
      'Zero accommodation for evolving multi-generational family dynamics or mobility.'
    ],
    nestoraTitle: 'Custom Constraint-Graph Generation',
    nestoraPoints: [
      'Custom born: room heights, setbacks, and door swings dynamically calculated.',
      'Ground-floor accessible master suites with zero-step transitions for senior parents.'
    ],
    primaryMetric: '0 Templates Used',
    metricLabel: 'Fitted to your family and plot',
    ctaText: 'Explore Styles',
    ctaLink: '/questionnaire'
  },
  {
    id: 'structure',
    stageNum: 'STAGE 03',
    stageTag: '3D RCC STRUCTURE',
    h2Title: 'Deterministic Structural Physics vs. Contractor Guesswork',
    seoSubtitle: 'Civil engineering limit-state calculations replace on-site contractor thumb rules and structural cracking.',
    oldWayTitle: 'On-Site Contractor Guesswork',
    oldWayPoints: [
      'Masons guessing column cross-sections and rebar diameters without structural analysis.',
      'Over-dimensioned concrete wasting ₹8L–₹12L or under-sized beams risking deflection.'
    ],
    nestoraTitle: 'Deterministic Civil Engineering',
    nestoraPoints: [
      'Exact axial load and tributary area calculation based on standard limit-state engineering.',
      'Foundation sized from a stated soil bearing assumption, for an engineer to confirm on site.'
    ],
    primaryMetric: 'Every number shown',
    metricLabel: 'Rule-based structural concept',
    ctaText: 'See a sample home',
    ctaLink: '/house/nest_f24390ae0f'
  },
  {
    id: 'enclosure',
    stageNum: 'STAGE 04',
    stageTag: 'TROPICAL ENCLOSURE',
    h2Title: 'Zoned Acoustic & Universal Accessibility vs. Standard Partitions',
    seoSubtitle: 'Acoustically isolated executive studios paired with seamless zero-threshold tropical garden connections.',
    oldWayTitle: 'Standard Domestic Noise Collisions',
    oldWayPoints: [
      'Single-brick 100mm walls transmitting 68 dB of street noise into home work rooms.',
      'Narrow 750mm doorways and step thresholds creating fall hazards for elders.'
    ],
    nestoraTitle: 'Zoned Performance Engineering',
    nestoraPoints: [
      'Decoupled double-stud STC-48 acoustic drywall deadening traffic noise to a quiet 32 dB.',
      'Wide 950mm doorways and non-slip honed Kota stone floors with courtyard ventilation.'
    ],
    primaryMetric: 'STC-48 Sound Rating',
    metricLabel: 'Universal Accessibility & Acoustic Zoning',
    ctaText: 'Test Living Modes',
    ctaLink: '/questionnaire'
  },
  {
    id: 'finishes',
    stageNum: 'STAGE 05',
    stageTag: 'FINISHES & BOQ',
    h2Title: 'Itemized Cost Estimate vs. Vague Per-Sqft Quotes',
    seoSubtitle: 'An itemized estimate down to cement bags and steel tonnage, with a typical stage-wise payment plan.',
    oldWayTitle: 'Uncontrolled Budget Creep',
    oldWayPoints: [
      'Vague square-foot contractor estimates that conceal finishing and electrical costs.',
      'Frequent 35%–50% project budget overruns forcing homeowners to halt construction.'
    ],
    nestoraTitle: 'Itemized Bill of Quantities',
    nestoraPoints: [
      'Itemized Mumbai construction BOQ with exact material quantities and prevailing rates.',
      'A typical stage-wise payment plan you can negotiate with your contractor.'
    ],
    primaryMetric: 'Itemized, not lump-sum',
    metricLabel: 'Estimate with quantities and rates',
    ctaText: 'Design Your Custom Home →',
    ctaLink: '/questionnaire'
  }
];

export default function UnifiedHorizontalStack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);
  const total = STAGES_DATA.length;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    damping: 26,
    stiffness: 120,
    mass: 0.8
  });

  // Track active index smoothly from scroll progress
  useEffect(() => {
    return smoothProgress.on("change", (latest) => {
      const idx = Math.min(total - 1, Math.floor(latest * total));
      setActiveIdx(idx);
    });
  }, [smoothProgress, total]);

  const scrollToSpread = (targetIndex: number) => {
    if (!containerRef.current) return;
    const totalHeight = containerRef.current.offsetHeight - window.innerHeight;
    const targetY = (targetIndex / (total - 1)) * totalHeight;
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  };

  return (
    <div ref={containerRef} className="relative h-[600vh] bg-[#F7F6F2]">
      {/* PINNED VIEWPORT */}
      <div className="sticky top-0 h-screen w-screen overflow-hidden flex flex-col justify-between pt-16 pb-14 px-4 sm:px-8 md:px-12">
        {/* Subtle Architectural Drafting Grid */}
        <div className="absolute inset-0 bg-architectural-grid opacity-35 pointer-events-none z-0" />

        {/* Top Monograph Status Line (No "Chapter" wording) */}
        <div className="relative z-20 flex items-center justify-between text-xs font-mono text-stone-muted border-b border-stone-border/80 pb-2.5">
          <div className="flex items-center space-x-2">
            <CompassRoseIcon className="w-3.5 h-3.5 text-sage-800" />
            <span className="font-bold text-sage-900 tracking-wider">
              FOLIO 0{activeIdx + 1} OF 0{total}
            </span>
            <span>•</span>
            <span className="uppercase font-semibold text-sage-800">
              {STAGES_DATA[activeIdx].stageTag}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-stone-muted hidden md:inline text-[11px]">
              Scroll to advance stage-wise journey
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => scrollToSpread(Math.max(0, activeIdx - 1))}
                disabled={activeIdx === 0}
                aria-label="Previous Folio"
                className="p-1 rounded-full text-sage-800 hover:bg-white transition-all disabled:opacity-30"
              >
                <ArrowFolioLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToSpread(Math.min(total - 1, activeIdx + 1))}
                disabled={activeIdx === total - 1}
                aria-label="Next Folio"
                className="p-1 rounded-full text-sage-800 hover:bg-white transition-all disabled:opacity-30"
              >
                <ArrowFolioRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3D LAYERED HORIZONTAL CAROUSEL STAGE */}
        <div className="relative flex-1 w-full flex items-center justify-center my-2 perspective-1000 z-10">
          {STAGES_DATA.map((stage, i) => {
            const isCurrent = activeIdx === i;
            const isPast = activeIdx > i;
            const isUpcoming = activeIdx < i;

            return (
              <motion.div
                key={stage.id}
                initial={false}
                animate={{
                  x: isCurrent ? '0%' : isPast ? '-25%' : '100%',
                  scale: isCurrent ? 1 : isPast ? 0.88 : 0.95,
                  rotateY: isCurrent ? 0 : isPast ? -8 : 8,
                  opacity: isCurrent ? 1 : isPast ? 0.12 : 0,
                  filter: isCurrent ? 'blur(0px)' : 'blur(5px)',
                  pointerEvents: isCurrent ? 'auto' : 'none'
                }}
                transition={{
                  type: 'spring',
                  damping: 26,
                  stiffness: 120,
                  mass: 0.8
                }}
                className="absolute inset-0 w-full h-full flex items-center justify-center will-change-transform"
                style={{
                  transformStyle: 'preserve-3d',
                  zIndex: isCurrent ? 20 : isPast ? 10 - (activeIdx - i) : 5
                }}
              >
                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                  {/* Left Column (58%): Morphological Progressive Stage Canvas */}
                  <div className="lg:col-span-7 flex justify-center">
                    <ProgressiveStageCanvas
                      stageIndex={i}
                      showSkeleton={i === 0 ? showSkeleton : false}
                      onToggleSkeleton={i === 0 ? () => setShowSkeleton(!showSkeleton) : undefined}
                    />
                  </div>

                  {/* Right Column (42%): Compact, Collision-Proof Comparison Card */}
                  <div className="lg:col-span-5 flex justify-center w-full">
                    <StageComparisonCard data={stage} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* BOTTOM FLOATING DOCK (Positioned safely to prevent collisions) */}
        <div className="relative z-20 flex items-center justify-between bg-white/95 backdrop-blur-xl border border-stone-border px-4 py-2 rounded-full shadow-xl max-w-2xl mx-auto w-full">
          {/* Active Folio Number */}
          <div className="flex items-center space-x-1.5 pr-3 border-r border-stone-border">
            <span className="text-xs font-mono font-bold text-sage-900">
              0{activeIdx + 1}
            </span>
            <span className="text-[10px] text-stone-muted">
              / 0{total}
            </span>
          </div>

          {/* Quick Folio Jump Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
            {STAGES_DATA.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => scrollToSpread(idx)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
                  activeIdx === idx
                    ? 'bg-sage-900 text-ivory-50 shadow-sm scale-105'
                    : 'text-stone-muted hover:text-sage-900 hover:bg-ivory-200/60'
                }`}
              >
                <span>{idx === 0 ? 'OVERVIEW' : `${idx}. ${s.id.toUpperCase()}`}</span>
              </button>
            ))}
          </div>

          {/* Progress Bar & Quick CTA */}
          <div className="flex items-center space-x-2 pl-2 border-l border-stone-border">
            <div className="w-12 h-1 bg-ivory-200 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-sage-800 transition-all duration-300 rounded-full"
                style={{ width: `${((activeIdx + 1) / total) * 100}%` }}
              />
            </div>
            <Link
              href="/questionnaire"
              className="inline-flex items-center space-x-1 bg-sage-900 hover:bg-black text-ivory-50 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm"
            >
              <span>Design</span>
              <ArrowFolioRightIcon className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
