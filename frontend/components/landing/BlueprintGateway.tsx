'use client';

import React from 'react';
import Link from 'next/link';
import { CompassRoseIcon, ShieldVerifiedIcon, ArrowFolioRightIcon } from './BespokeIcons';

export default function BlueprintGateway() {
  return (
    <section className="py-24 px-6 md:px-12 lg:px-20 bg-white">
      <div className="w-full max-w-5xl mx-auto text-center space-y-8">
        {/* Micro Tag */}
        <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-champagne bg-ivory-100 px-4 py-1.5 rounded-full border border-stone-border">
          <CompassRoseIcon className="w-3.5 h-3.5 text-sage-800" />
          <span>Chapter 04 • The Blueprint Gateway</span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-sage-900 tracking-tight max-w-3xl mx-auto leading-tight">
            Your Custom Home Is Waiting To Be Born.
          </h2>
          <p className="text-sm md:text-base text-stone-muted max-w-xl mx-auto leading-relaxed">
            Answer 4 simple lifestyle questions, swipe 30 aesthetic cards, and inspect your complete House Twin with blueprints, 3D structure, and itemized BOQ.
          </p>
        </div>

        {/* CAD Blueprint Preview Sheet */}
        <div className="relative max-w-2xl mx-auto rounded-3xl border border-stone-border p-6 bg-ivory-100 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center text-xs font-mono text-stone-muted border-b border-stone-border/80 pb-3 mb-4">
            <span className="font-bold text-sage-900">DRAWING NO: NEST-MUM-3040-01</span>
            <span>SCALE 1:100</span>
          </div>

          <svg className="w-full h-56" viewBox="0 0 540 220" fill="none" stroke="#1A241E" strokeWidth="0.9">
            {/* Outer Setbacks */}
            <rect x="25" y="15" width="490" height="190" strokeDasharray="3 3" stroke="#8C867A" />
            <text x="270" y="28" fill="#8C867A" fontSize="9" textAnchor="middle" fontFamily="monospace">FRONT SETBACK 3.0M</text>
            
            {/* Building Envelope */}
            <rect x="50" y="38" width="440" height="150" fill="#ffffff" stroke="#1A241E" strokeWidth="1.5" />
            
            {/* Rooms */}
            {/* Living Courtyard */}
            <rect x="65" y="50" width="225" height="126" fill="#E5EBE3" fillOpacity="0.6" stroke="#26352C" />
            <text x="177" y="110" fontSize="12" textAnchor="middle" fill="#1A241E" fontWeight="bold">Living & Courtyard (5.2m × 4.0m)</text>
            <text x="177" y="125" fontSize="9" textAnchor="middle" fill="#4A6153">Polished Kota Stone • R11</text>
            
            {/* Ground Master Bed */}
            <rect x="300" y="50" width="175" height="70" fill="#EFECE4" fillOpacity="0.7" stroke="#26352C" />
            <text x="387" y="85" fontSize="11" textAnchor="middle" fill="#1A241E" fontWeight="bold">Ground Master (4.0m × 3.5m)</text>
            <text x="387" y="98" fontSize="8" textAnchor="middle" fill="#8C867A">Zero-Step Threshold</text>

            {/* Agneya Kitchen */}
            <rect x="300" y="125" width="175" height="51" fill="#E5E1D6" fillOpacity="0.7" stroke="#26352C" />
            <text x="387" y="152" fontSize="10" textAnchor="middle" fill="#1A241E" fontWeight="bold">Agneya Kitchen (3.2m × 2.6m)</text>

            {/* Dimensions */}
            <line x1="50" y1="200" x2="490" y2="200" stroke="#1A241E" strokeWidth="1" />
            <text x="270" y="212" fill="#1A241E" fontSize="9" textAnchor="middle" fontFamily="monospace">PLOT WIDTH: 30'-0" (9.14M)</text>
          </svg>

          <div className="mt-4 pt-3 border-t border-stone-border/80 flex flex-wrap justify-between items-center text-xs text-sage-800">
            <span className="font-bold">Mumbai Pilot Specimen: 30×40 G+1 (1,480 sqft Built-Up)</span>
            <span className="text-emerald-700 font-semibold flex items-center space-x-1">
              <ShieldVerifiedIcon className="w-3.5 h-3.5" />
              <span>100% Judge Passed</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/questionnaire"
            className="w-full sm:w-auto bg-sage-900 hover:bg-black text-ivory-50 px-9 py-4 rounded-full text-sm font-black tracking-wide shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Begin Questionnaire & Design Home</span>
            <ArrowFolioRightIcon className="w-4 h-4" />
          </Link>
          <Link
            href="/house/nest_09935d4293"
            className="w-full sm:w-auto bg-ivory-100 hover:bg-ivory-200 text-sage-900 border border-stone-border px-7 py-4 rounded-full text-sm font-bold tracking-wide transition-all shadow-xs"
          >
            Inspect Sample House Twin (30×40)
          </Link>
        </div>
      </div>
    </section>
  );
}
