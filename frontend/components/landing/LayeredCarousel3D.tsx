'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import BenefitComparisonCard, { BenefitData } from './BenefitComparisonCard';
import { CompassRoseIcon, ArrowFolioLeftIcon, ArrowFolioRightIcon, ShieldVerifiedIcon } from './BespokeIcons';

const BENEFITS_DATA: (BenefitData & { imageSrc: string; imageAlt: string; imageLabel: string })[] = [
  {
    id: 'velocity',
    folioNum: 'FOLIO 01',
    themeTag: 'VELOCITY & SYNTHESIS',
    h2Title: 'Instant AI House Twin vs. 6-Month Architectural Delays',
    seoSubtitle: 'Generate complete 30×40 G+1 residential house plans with full structural and municipal clearance in 60 seconds.',
    oldWayTitle: 'Traditional Architecture Delays',
    oldWayPoints: [
      '6 to 9 months of endless drafting meetings and slow AutoCAD revisions.',
      'Fragmented coordination between architect, structural engineer, and MEP consultants.',
      'Manual municipal bye-law checks often resulting in costly plan rejections.'
    ],
    nestoraTitle: 'Autonomous Multi-Model Synthesis',
    nestoraPoints: [
      'Complete House Twin (2D CAD, 3D Structure, MEP, Finishes) generated in 60 seconds.',
      '14 specialized deterministic task models execute in parallel.',
      'Automated MCGM DCR 2034 building envelope verification with zero approval friction.'
    ],
    primaryMetric: '60-Second Generation',
    metricLabel: 'Validated Plot-to-Keys Synthesis',
    imageSrc: '/images/home/hero_dusk_courtyard.png',
    imageAlt: 'Photorealistic Dusk Tropical Modern Courtyard Villa 30x40 G+1',
    imageLabel: 'Bespoke 30×40 G+1 Tropical Villa Specimen',
    ctaText: 'Start Questionnaire',
    ctaLink: '/questionnaire'
  },
  {
    id: 'customization',
    folioNum: 'FOLIO 02',
    themeTag: 'BESPOKE ARCHITECTURE',
    h2Title: '100% Bespoke Family Floor Plans vs. Recycled Template Catalogues',
    seoSubtitle: 'No generic floor plans. Algorithmic constraint graphs synthesize sunlight, family mobility, and lifestyle routines.',
    oldWayTitle: 'Recycled Catalog Templates',
    oldWayPoints: [
      'Pre-drawn generic floor plans stamped onto your plot with zero site sensitivity.',
      'Poor natural ventilation leading to stagnant air and excessive air conditioning costs.',
      'Zero accommodation for evolving multi-generational family dynamics or mobility barriers.'
    ],
    nestoraTitle: 'Custom Constraint-Graph Generation',
    nestoraPoints: [
      'Custom born: room heights, setbacks, and door swings dynamically calculated per brief.',
      'Sun-path and wind microclimate simulation cuts peak summer heat by 68%.',
      'Ground-floor accessible master suites with zero-step transitions for senior parents.'
    ],
    primaryMetric: '0 Templates Used',
    metricLabel: '100% Bespoke Constraint Geometry',
    imageSrc: '/images/home/living_courtyard.png',
    imageAlt: 'Sun-Drenched Double-Height Living Room with Central Courtyard',
    imageLabel: 'Sun-Drenched Living Courtyard & Atrium',
    ctaText: 'Explore Styles',
    ctaLink: '/swipe'
  },
  {
    id: 'acoustics',
    folioNum: 'FOLIO 03',
    themeTag: 'ACOUSTICS & ACCESSIBILITY',
    h2Title: 'Zoned Acoustic & Universal Accessibility Engineering vs. Standard Partitions',
    seoSubtitle: 'Acoustically isolated WFH executive studios paired with zero-threshold senior living suites.',
    oldWayTitle: 'Standard Domestic Collisions',
    oldWayPoints: [
      'Single-brick 100mm walls transmitting 68 dB of street and television noise into work rooms.',
      'Narrow 750mm doorways and step thresholds creating daily fall hazards for grandparents.',
      'Client meetings in home offices disrupting family living spaces.'
    ],
    nestoraTitle: 'Zoned Performance Engineering',
    nestoraPoints: [
      'Decoupled double-stud STC-48 acoustic drywall deadening traffic noise to a quiet 32 dB.',
      'Dedicated client foyer allowing private professional consultations without domestic crossover.',
      'Wide 950mm clear doorways and non-slip R11 Rajasthan Kota stone floors.'
    ],
    primaryMetric: 'STC-48 Sound Rating',
    metricLabel: 'Universal Accessibility & Acoustic Zoning',
    imageSrc: '/images/home/wfh_studio.png',
    imageAlt: 'Quiet North-Light Executive Studio and Library',
    imageLabel: 'STC-48 Acoustic Studio & Library Pod',
    ctaText: 'Test Floor Plans',
    ctaLink: '/questionnaire'
  },
  {
    id: 'engineering',
    folioNum: 'FOLIO 04',
    themeTag: 'DETERMINISTIC PHYSICS & ACCESSIBILITY',
    h2Title: 'Deterministic Structural Physics vs. Contractor Guesswork',
    seoSubtitle: 'Eliminate on-site guesswork with pure algorithmic civil engineering: column sizing, soil bearing, and zero-threshold accessibility.',
    oldWayTitle: 'On-Site Contractor Guesswork',
    oldWayPoints: [
      'Masons guessing column cross-sections and rebar diameters without structural calculations.',
      'Risk of catastrophic differential settlement, beam deflection, and foundation cracking.',
      'Over-dimensioned concrete wasting ₹8L–₹12L in unnecessary cement and steel.'
    ],
    nestoraTitle: 'Deterministic Civil Engineering',
    nestoraPoints: [
      'Exact axial load and tributary area calculation based on standard limit-state engineering.',
      'Soil bearing capacity verified at 150 kN/m² with optimized raft footings.',
      'Deterministic Judge enforces 5 stage-gates before releasing structural blueprints.'
    ],
    primaryMetric: '100% Structural Verification',
    metricLabel: 'Zero Hallucination Structural Math',
    imageSrc: '/images/home/garden_suite.png',
    imageAlt: 'Zero-Threshold Ground Floor Garden Suite with Structural Framework',
    imageLabel: 'Ground Suite & Verified Structural Concrete Frame',
    ctaText: 'View Sample Twin',
    ctaLink: '/house/nest_09935d4293'
  },
  {
    id: 'boq',
    folioNum: 'FOLIO 05',
    themeTag: 'FINANCIAL CERTAINTY & FINISHES',
    h2Title: 'Exact Itemized BOQ & Milestone Escrow vs. 40% Construction Cost Overruns',
    seoSubtitle: 'Transparent Bill of Quantities down to cement bags and steel tonnage, backed by bank loan milestone schedules.',
    oldWayTitle: 'Uncontrolled Budget Creep',
    oldWayPoints: [
      'Vague square-foot contractor estimates that hide finishing, excavation, and electrical costs.',
      'Unscheduled advance demands from contractors with zero escrow accountability.',
      'Frequent 35%–50% project budget overruns forcing homeowners to halt construction.'
    ],
    nestoraTitle: 'Guaranteed Bill of Quantities',
    nestoraPoints: [
      'Itemized Mumbai construction BOQ with exact material quantities and prevailing market rates.',
      '5-stage milestone release schedule (Foundation, Plinth, Slabs, Finishes, Handover).',
      'Automated bank loan estimate, monthly EMI calculator, and contractor bidding specs.'
    ],
    primaryMetric: '0% Hidden Costs',
    metricLabel: 'Guaranteed Itemized BOQ & Milestone Escrow',
    imageSrc: '/images/home/tactile_materials.png',
    imageAlt: 'Top-Down Architectural Material Moodboard Flatlay with Kota Stone and Teak',
    imageLabel: 'Tactile Materiality: Honed Kota, Teak & Lime Plaster',
    ctaText: 'Design Your Custom Home →',
    ctaLink: '/questionnaire'
  }
];

export default function LayeredCarousel3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const total = BENEFITS_DATA.length;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    damping: 24,
    stiffness: 100,
    mass: 0.8
  });

  // Track active index based on scroll
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
    <div ref={containerRef} className="relative h-[500vh] bg-[#F7F6F2]">
      {/* PINNED VIEWPORT */}
      <div className="sticky top-0 h-screen w-screen overflow-hidden flex flex-col justify-between pt-16 pb-16 px-6 md:px-12 lg:px-16">
        {/* Background Subtle Drafting Grid */}
        <div className="absolute inset-0 bg-architectural-grid opacity-35 pointer-events-none z-0" />

        {/* Top Monograph Status Line */}
        <div className="relative z-20 flex items-center justify-between text-xs font-mono text-stone-muted border-b border-stone-border/80 pb-3">
          <div className="flex items-center space-x-2">
            <CompassRoseIcon className="w-3.5 h-3.5 text-sage-800" />
            <span className="font-bold text-sage-900 tracking-wider">
              FOLIO {activeIdx + 1} OF 0{total}
            </span>
            <span>•</span>
            <span className="hidden sm:inline uppercase">{BENEFITS_DATA[activeIdx].themeTag}</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sage-800 font-semibold hidden md:inline">
              Scroll down to journey through the home
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => scrollToSpread(Math.max(0, activeIdx - 1))}
                disabled={activeIdx === 0}
                aria-label="Previous Spread"
                className="p-1 rounded-full text-sage-800 hover:bg-white transition-all disabled:opacity-30"
              >
                <ArrowFolioLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToSpread(Math.min(total - 1, activeIdx + 1))}
                disabled={activeIdx === total - 1}
                aria-label="Next Spread"
                className="p-1 rounded-full text-sage-800 hover:bg-white transition-all disabled:opacity-30"
              >
                <ArrowFolioRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3D LAYERED CAROUSEL STAGE */}
        <div className="relative flex-1 w-full flex items-center justify-center my-4 perspective-1000 z-10">
          {BENEFITS_DATA.map((benefit, i) => {
            // Normalized offset from current active index
            const isCurrent = activeIdx === i;
            const isPast = activeIdx > i;
            const isUpcoming = activeIdx < i;

            return (
              <motion.div
                key={benefit.id}
                initial={false}
                animate={{
                  x: isCurrent ? '0%' : isPast ? '-30%' : '100%',
                  scale: isCurrent ? 1 : isPast ? 0.88 : 0.95,
                  rotateY: isCurrent ? 0 : isPast ? -8 : 8,
                  opacity: isCurrent ? 1 : isPast ? 0.15 : 0,
                  filter: isCurrent ? 'blur(0px)' : 'blur(5px)',
                  pointerEvents: isCurrent ? 'auto' : 'none'
                }}
                transition={{
                  type: 'spring',
                  damping: 24,
                  stiffness: 110,
                  mass: 0.8
                }}
                className="absolute inset-0 w-full h-full flex items-center justify-center will-change-transform"
                style={{
                  transformStyle: 'preserve-3d',
                  zIndex: isCurrent ? 20 : isPast ? 10 - (activeIdx - i) : 5
                }}
              >
                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Left Column (60%): Photorealistic Tropical Home Space Render */}
                  <div className="lg:col-span-7">
                    <div className="relative rounded-3xl overflow-hidden border border-stone-border shadow-2xl bg-ivory-200 aspect-[16/11] max-h-[520px]">
                      {/* Render Architectural Photograph */}
                      <img
                        src={benefit.imageSrc}
                        alt={benefit.imageAlt}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      {/* Ambient Grid Texture */}
                      <div className="absolute inset-0 bg-architectural-grid opacity-20 pointer-events-none" />

                      {/* Top Label */}
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-white border border-white/20 shadow-sm flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{benefit.imageLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (40%): The Old Way vs Nestora Way Matrix */}
                  <div className="lg:col-span-5">
                    <BenefitComparisonCard data={benefit} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* BOTTOM FLOATING PROGRESS DOCK */}
        <div className="relative z-20 flex items-center justify-between bg-white/90 backdrop-blur-xl border border-stone-border/80 px-6 py-2.5 rounded-full shadow-xl max-w-2xl mx-auto w-full">
          {/* Active Chapter Label */}
          <div className="flex items-center space-x-2 pr-4 border-r border-stone-border">
            <span className="text-xs font-mono font-bold text-sage-900">
              0{activeIdx + 1}
            </span>
            <span className="text-[11px] text-stone-muted hidden sm:inline">
              / 0{total}
            </span>
          </div>

          {/* Quick Folio Jump Pills */}
          <div className="flex items-center space-x-1.5">
            {BENEFITS_DATA.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => scrollToSpread(idx)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeIdx === idx
                    ? 'bg-sage-900 text-ivory-50 shadow-md scale-105'
                    : 'text-stone-muted hover:text-sage-900 hover:bg-ivory-200/60'
                }`}
              >
                <span>{idx + 1}.</span>
                <span className="hidden md:inline ml-1">{b.id.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Progress Line */}
          <div className="w-16 h-1 bg-ivory-200 rounded-full overflow-hidden mx-2">
            <div
              className="h-full bg-sage-800 transition-all duration-300 rounded-full"
              style={{ width: `${((activeIdx + 1) / total) * 100}%` }}
            />
          </div>

          {/* Direct CTA */}
          <Link
            href="/questionnaire"
            className="hidden sm:inline-flex items-center space-x-1 bg-sage-900 hover:bg-black text-ivory-50 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
          >
            <span>Design</span>
            <ArrowFolioRightIcon className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
