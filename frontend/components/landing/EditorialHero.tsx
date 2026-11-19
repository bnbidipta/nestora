'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CompassRoseIcon, 
  PlumbBobIcon, 
  CantileverBeamIcon, 
  ShieldVerifiedIcon, 
  ArrowFolioRightIcon 
} from './BespokeIcons';

export default function EditorialHero() {
  const [showSkeleton, setShowSkeleton] = useState(false);

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center py-12 px-6 md:px-12 lg:px-20 border-b border-stone-border bg-[#F7F6F2]">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Bold Editorial Typography & Vision */}
        <div className="lg:col-span-5 space-y-6">
          {/* Micro Folio Tag */}
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-champagne bg-white px-3.5 py-1.5 rounded-full border border-stone-border shadow-2xs">
            <CompassRoseIcon className="w-3.5 h-3.5 text-sage-800" />
            <span>Chapter 01 • The Arrival</span>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-sage-900 tracking-tight leading-[1.05]">
              THE ARCHITECT <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-900 via-sage-800 to-sage-600">
                IN YOUR POCKET.
              </span>
            </h1>
            <p className="text-xl font-bold text-sage-800 tracking-tight">
              From Bare Plot to Keys in Hand.
            </p>
          </div>

          {/* Body Copy - Authentic, No AI Slop */}
          <p className="text-sm md:text-base text-stone-muted leading-relaxed max-w-lg">
            No cookie-cutter templates. Nestora synthesizes your family lifestyle, Mumbai soil physics, and local sunlight into an architect-level custom home in seconds.
          </p>

          {/* Verified Engineering Credentials Strip */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-white p-4 rounded-2xl border border-stone-border shadow-xs">
              <span className="text-xl font-black text-sage-900 block">Zero</span>
              <span className="text-[10px] uppercase font-bold text-stone-muted tracking-wider">Templates</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-border shadow-xs">
              <span className="text-xl font-black text-sage-900 block">100%</span>
              <span className="text-[10px] uppercase font-bold text-stone-muted tracking-wider">Physics Driven</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-border shadow-xs">
              <span className="text-xl font-black text-sage-900 block">14</span>
              <span className="text-[10px] uppercase font-bold text-stone-muted tracking-wider">Task Models</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/questionnaire"
              className="bg-sage-900 hover:bg-black text-ivory-50 px-8 py-4 rounded-full text-sm font-bold tracking-wide shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
            >
              <span>Design Your Home</span>
              <ArrowFolioRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="#adaptations"
              className="text-xs font-bold text-sage-800 hover:text-black py-3 px-4 rounded-full hover:bg-white/80 transition-all border border-transparent hover:border-stone-border"
            >
              Explore Living Adaptations ↓
            </Link>
          </div>
        </div>

        {/* Right Column: Tropical Modern Courtyard Villa Showcase */}
        <div className="lg:col-span-7">
          <div className="relative rounded-3xl overflow-hidden border border-stone-border shadow-2xl bg-gradient-to-b from-[#EAE6DC] to-[#D5CEC5]">
            {/* The Visual Stage */}
            <div className="relative aspect-[16/11] w-full overflow-hidden">
              {/* Photorealistic Render / Background */}
              <img
                src="/images/home/hero_dusk_courtyard.png"
                alt="Tropical Modern Courtyard Villa at Dusk"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                onError={(e) => {
                  // Fallback architectural backdrop if image is still generating
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              {/* Architectural Ambient Fallback / Texture */}
              <div className="absolute inset-0 bg-architectural-grid opacity-30 pointer-events-none" />

              {/* CAD Skeleton Overlay (When Toggled) */}
              {showSkeleton && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-sage-950/80 backdrop-blur-xs p-6 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start text-xs font-mono text-emerald-400">
                    <div>
                      <div>IS 456 RCC COLUMN GRID (C1 - C6)</div>
                      <div className="text-[10px] text-emerald-500/70">M25 Grade Concrete • Fe500D TMT Reinforcement</div>
                    </div>
                    <span className="bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/40 text-[10px]">
                      Live CAD Overlay
                    </span>
                  </div>

                  {/* SVG Column & Beam Wireframe */}
                  <svg className="w-full h-48 opacity-90" viewBox="0 0 500 220" fill="none" stroke="#10b981" strokeWidth="1.2">
                    {/* Footing Raft */}
                    <rect x="40" y="180" width="420" height="20" strokeDasharray="3 2" fill="#064e3b" fillOpacity="0.4" />
                    <text x="250" y="194" fill="#34d399" fontSize="10" textAnchor="middle" fontFamily="monospace">150 kN/m² Isolated Raft Footing</text>
                    {/* Columns */}
                    <rect x="60" y="40" width="16" height="140" fill="#10b981" fillOpacity="0.6" />
                    <rect x="242" y="40" width="16" height="140" fill="#10b981" fillOpacity="0.6" />
                    <rect x="424" y="40" width="16" height="140" fill="#10b981" fillOpacity="0.6" />
                    {/* Beams */}
                    <rect x="60" y="40" width="380" height="16" fill="#10b981" fillOpacity="0.4" />
                    <rect x="60" y="110" width="380" height="16" fill="#10b981" fillOpacity="0.4" />
                    {/* Annotation Tags */}
                    <text x="68" y="32" fill="#a7f3d0" fontSize="9" textAnchor="middle" fontFamily="monospace">C1 (300×450)</text>
                    <text x="250" y="32" fill="#a7f3d0" fontSize="9" textAnchor="middle" fontFamily="monospace">C2 (300×450)</text>
                    <text x="432" y="32" fill="#a7f3d0" fontSize="9" textAnchor="middle" fontFamily="monospace">C3 (300×450)</text>
                  </svg>

                  <div className="text-[11px] font-mono text-emerald-300 flex justify-between">
                    <span>Max Beam Span: 4.8m (IS 456 L/d Compliant)</span>
                    <span>Axial Load Safety: 1.84 SF</span>
                  </div>
                </motion.div>
              )}

              {/* Top Bar Badges */}
              <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-20">
                <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>30×40 G+1 Tropical Villa Specimen</span>
                </div>

                <button
                  onClick={() => setShowSkeleton(!showSkeleton)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md backdrop-blur-md border ${
                    showSkeleton 
                      ? 'bg-emerald-500 text-black border-emerald-400' 
                      : 'bg-white/90 text-sage-900 border-stone-border hover:bg-white'
                  }`}
                >
                  {showSkeleton ? 'View Render' : 'Inspect Structural Skeleton'}
                </button>
              </div>

              {/* Bottom Architectural Rationale Card */}
              <div className="absolute bottom-5 left-5 right-5 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-stone-border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-champagne">
                    Bioclimatic Mumbai Architecture
                  </div>
                  <h4 className="text-sm font-bold text-sage-900 mt-0.5">
                    Sun-Dappled Courtyard with Teak Shading Louvers
                  </h4>
                </div>
                <div className="flex items-center space-x-2 text-xs font-bold text-sage-800 bg-ivory-100 px-3 py-1.5 rounded-full border border-stone-border flex-shrink-0">
                  <ShieldVerifiedIcon className="w-4 h-4 text-emerald-600" />
                  <span>MCGM DCR 2034 Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
