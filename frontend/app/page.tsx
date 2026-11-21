'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import SmoothScrollProvider from '@/components/motion/SmoothScrollProvider';
import UnifiedHorizontalStack from '@/components/landing/UnifiedHorizontalStack';
import { CompassRoseIcon, ArrowFolioRightIcon } from '@/components/landing/BespokeIcons';
import MobileLanding from '@/components/landing/mobile/MobileLanding';
import { warmUpApi } from '@/lib/api';

function DesktopLanding() {
  // Structured JSON-LD Schema for Google Search, GEO, and AI Engine Optimization
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NESTORA AI Architect",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "Global autonomous AI architectural platform synthesizing bespoke residential house plans from plot to keys. Instant 2D CAD blueprints, 3D structural twin, MEP, and itemized BOQ for Mumbai 30x40 G+1 homes.",
    "creator": {
      "@type": "Organization",
      "name": "Nestora Technologies"
    },
    "keywords": "AI Architect, Mumbai 30x40 G+1 house plan, plot to keys home design, MCGM DCR 2034 building bylaws, IS 456 column design, itemized construction BOQ"
  };

  return (
    <SmoothScrollProvider>
      {/* Inject Structured Data for SEO / AIEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative min-h-screen bg-[#F7F6F2] text-[#1A241E] font-sans selection:bg-sage-900 selection:text-white">
        {/* Sticky Editorial Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-3.5 bg-[#F7F6F2]/90 backdrop-blur-md border-b border-stone-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-sage-900 text-ivory-50 flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
              N
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-sage-900">NESTORA</h1>
              <p className="text-[9px] uppercase tracking-widest text-stone-muted hidden sm:block">
                Global Autonomous Architecture Studio
              </p>
            </div>
          </div>

          {/* Center Monograph Stamp */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-sage-800 bg-white/80 px-4 py-1.5 rounded-full border border-stone-border shadow-2xs">
            <CompassRoseIcon className="w-4 h-4 text-champagne" />
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
              className="flex items-center space-x-1.5 bg-sage-900 text-ivory-50 hover:bg-black px-4 py-2 rounded-full text-xs font-bold tracking-wide shadow-md hover:shadow-lg transition-all duration-200"
            >
              <span>Design Your Home</span>
              <ArrowFolioRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Semantic H1 Container (Screen-reader & Search Engine Optimized) */}
        <div className="sr-only">
          <h1>NESTORA: Global AI Architect — Custom Residential Design & Engineering From Plot to Keys</h1>
          <p>
            Instant Mumbai 30x40 G+1 house planning, MCGM DCR 2034 municipal bylaws compliance, IS 456 structural physics, and itemized bill of quantities.
          </p>
        </div>

        {/* 3D UNIFIED HORIZONTAL STACK (HERO TO 5-STAGE PROGRESSION) */}
        <main className="w-full">
          <UnifiedHorizontalStack />
        </main>

        {/* Technical Footer */}
        <footer className="py-8 px-6 md:px-12 border-t border-stone-border bg-[#EFECE4] text-xs text-stone-muted flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sage-900">NESTORA ARCHITECTURAL INTELLIGENCE</span>
            <span>•</span>
            <span>Phase 1 Mumbai Pilot</span>
          </div>
          <div className="text-[11px] font-mono">
            <span>Concept Design • Automated Rule Checks • Itemized Estimate</span>
          </div>
        </footer>
      </div>
    </SmoothScrollProvider>
  );
}

// The 3D scroll-world is too heavy for budget phones and ignores reduced-motion users,
// so render the light static page first and upgrade only where it fits.
const DESKTOP_QUERY = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';

export default function LandingPage() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    warmUpApi();
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop ? <DesktopLanding /> : <MobileLanding />;
}
