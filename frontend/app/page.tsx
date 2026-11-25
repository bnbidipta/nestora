'use client';

import React, { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import Link from 'next/link';
import SmoothScrollProvider from '@/components/motion/SmoothScrollProvider';
import UnifiedHorizontalStack from '@/components/landing/UnifiedHorizontalStack';
import { CompassRoseIcon, ArrowFolioRightIcon } from '@/components/landing/BespokeIcons';
import MobileLanding from '@/components/landing/mobile/MobileLanding';
import ScrollVideo from '@/components/landing/ScrollVideo';
import { warmUpApi } from '@/lib/api';
import { track } from '@/lib/analytics';

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
    <MotionConfig reducedMotion="user">
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width={36} height={36} className="h-9 w-9" />
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
              href="/house/nest_f24390ae0f"
              className="hidden md:inline-flex text-xs font-bold text-sage-800 hover:text-sage-900 underline underline-offset-4 transition-colors"
            >
              See a sample home
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
          <ScrollVideo src="/video/hero.mp4" mobileSrc="/video/hero-mobile.mp4" poster="/video/hero-poster.jpg" cta={{ href: '/questionnaire', text: 'Design my home' }}>
            <h2 className="max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-6xl">Your family. Your plot.<br />A home that fits.</h2>
            <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">Answer a few questions. Get a house design that follows the building rules, a cost estimate, and a walk-through in 3D.</p>
          </ScrollVideo>
          <UnifiedHorizontalStack />
          <ScrollVideo src="/video/walkthrough.mp4" poster="/video/walkthrough-poster.jpg" cta={{ href: '/house/nest_f24390ae0f', text: 'Walk through a sample home' }}>
            <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight md:text-5xl">Walk through your home before a single brick is laid.</h2>
            <p className="mt-3 max-w-xl text-white/85">Every design opens in 3D: look around, walk room to room, and watch the light move from morning to night.</p>
          </ScrollVideo>
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
          <nav className="flex gap-4 text-[11px]" aria-label="Legal">
            <a href="/privacy" className="underline hover:text-sage-900">Privacy</a>
            <a href="/terms" className="underline hover:text-sage-900">Terms</a>
          </nav>
        </footer>
      </div>
    </SmoothScrollProvider>
    </MotionConfig>
  );
}

// The 3D scroll-world is too heavy for budget phones: render the light static page first and upgrade on tablets,
// laptops and desktops. Reduced-motion users get the same page with motion calmed (MotionConfig + CSS), not a swap.
const DESKTOP_QUERY = '(min-width: 768px)';

export default function LandingPage() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    warmUpApi();
    track('landing_view');
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop ? <DesktopLanding /> : <MobileLanding />;
}
