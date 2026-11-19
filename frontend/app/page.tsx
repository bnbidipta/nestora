'use client';

import React from 'react';
import Link from 'next/link';
import SmoothScrollProvider from '@/components/motion/SmoothScrollProvider';
import DraftingCrosshair from '@/components/motion/DraftingCrosshair';
import EditorialHero from '@/components/landing/EditorialHero';
import FamilyAdaptationShowcase from '@/components/landing/FamilyAdaptationShowcase';
import TactileMaterialFlatlay from '@/components/landing/TactileMaterialFlatlay';
import BlueprintGateway from '@/components/landing/BlueprintGateway';
import { CompassRoseIcon, ArrowFolioRightIcon } from '@/components/landing/BespokeIcons';

export default function LandingPage() {
  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen bg-[#F7F6F2] text-[#1A241E] font-sans selection:bg-sage-900 selection:text-white">
        {/* Precision CAD Crosshair Cursor Follower */}
        <DraftingCrosshair />

        {/* Top Editorial Monograph Navigation */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-12 py-4 bg-[#F7F6F2]/90 backdrop-blur-md border-b border-stone-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-sage-900 text-ivory-50 flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
              N
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-sage-900">NESTORA</h1>
              <p className="text-[10px] uppercase tracking-widest text-stone-muted hidden sm:block">
                Global Autonomous Architecture Studio
              </p>
            </div>
          </div>

          {/* Center Editorial Monograph Stamp */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-sage-800 bg-white/80 px-4 py-1.5 rounded-full border border-stone-border shadow-2xs">
            <CompassRoseIcon className="w-3.5 h-3.5 text-champagne" />
            <span className="font-semibold">Mumbai Pilot • 30×40 G+1 Monograph</span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/house/nest_09935d4293"
              className="hidden md:inline-flex text-xs font-bold text-sage-800 hover:text-sage-900 underline underline-offset-4 transition-colors"
            >
              Inspect Sample House Twin
            </Link>
            <Link
              href="/questionnaire"
              className="flex items-center space-x-2 bg-sage-900 text-ivory-50 hover:bg-black px-4 py-2 rounded-full text-xs font-bold tracking-wide shadow-md hover:shadow-lg transition-all duration-200"
            >
              <span>Design Your Home</span>
              <ArrowFolioRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* MAIN EDITORIAL SCROLLYTELLING CONTAINER */}
        <main className="w-full">
          {/* Chapter 01: The Arrival & Vision */}
          <EditorialHero />

          {/* Chapter 02: Spatial Adaptation Engine */}
          <FamilyAdaptationShowcase />

          {/* Chapter 03: Tactile Materiality & Physics */}
          <TactileMaterialFlatlay />

          {/* Chapter 04: The Blueprint Gateway */}
          <BlueprintGateway />
        </main>

        {/* Footer */}
        <footer className="py-8 px-6 md:px-12 border-t border-stone-border bg-[#EFECE4] text-xs text-stone-muted flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sage-900">NESTORA ARCHITECTURAL INTELLIGENCE</span>
            <span>•</span>
            <span>Phase 1 Mumbai Pilot</span>
          </div>
          <div>
            <span>100% Deterministic Engineering • IS 456 • MCGM DCR 2034</span>
          </div>
        </footer>
      </div>
    </SmoothScrollProvider>
  );
}
