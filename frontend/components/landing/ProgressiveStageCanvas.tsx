'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CompassRoseIcon, ArchitecturalRulerIcon, ShieldVerifiedIcon } from './BespokeIcons';

interface ProgressiveStageCanvasProps {
  stageIndex: number;
  showSkeleton?: boolean;
  onToggleSkeleton?: () => void;
}

export default function ProgressiveStageCanvas({
  stageIndex,
  showSkeleton = false,
  onToggleSkeleton
}: ProgressiveStageCanvasProps) {
  // 3D Mouse Parallax Tilt state
  const containerRef = useRef<HTMLDivElement>(null);
  const tilt = (rx: number, ry: number) => {
    if (containerRef.current) containerRef.current.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    tilt(-(e.clientY - rect.top - rect.height / 2) * 0.01, (e.clientX - rect.left - rect.width / 2) * 0.01);
  };
  const handleMouseLeave = () => tilt(0, 0);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-[16/11] max-h-[min(480px,64vh)] rounded-2xl md:rounded-3xl overflow-hidden border border-stone-border shadow-2xl bg-ivory-100 transition-transform duration-200 ease-out will-change-transform"
    >
      {/* =========================================================================
          SPREAD 0: PLATFORM OVERVIEW (TWILIGHT VILLA + SKELETON TOGGLE)
          ========================================================================= */}
      {stageIndex === 0 && (
        <div className="relative w-full h-full">
          <img
            src="/images/home/hero_dusk_courtyard.png"
            alt="Bespoke 30x40 G+1 Tropical Modern Courtyard Villa at Dusk"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />

          {/* Interactive Structural Skeleton Wireframe Overlay */}
          {showSkeleton && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sage-950/85 backdrop-blur-xs flex flex-col justify-between p-6 z-20 font-mono text-xs text-champagne"
            >
              <div className="flex justify-between items-center border-b border-champagne/30 pb-2">
                <span className="font-bold tracking-widest text-white">DETERMINISTIC RCC COLUMN GRID (C1 - C6)</span>
                <span className="text-[10px] bg-champagne/20 text-champagne px-2 py-0.5 rounded border border-champagne/40">
                  IS 456 LIMIT STATE
                </span>
              </div>

              {/* Vector Wireframe Blueprint Lines */}
              <div className="flex-1 flex items-center justify-center py-4">
                <svg className="w-full h-44 text-champagne" viewBox="0 0 400 160" fill="none" stroke="currentColor" strokeWidth="1">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="360" y2="30" strokeDasharray="3 3" opacity="0.4" />
                  <line x1="40" y1="130" x2="360" y2="130" strokeDasharray="3 3" opacity="0.4" />
                  <line x1="60" y1="15" x2="60" y2="145" strokeDasharray="3 3" opacity="0.4" />
                  <line x1="200" y1="15" x2="200" y2="145" strokeDasharray="3 3" opacity="0.4" />
                  <line x1="340" y1="15" x2="340" y2="145" strokeDasharray="3 3" opacity="0.4" />

                  {/* Columns C1 to C6 */}
                  <rect x="52" y="22" width="16" height="16" fill="#D4AF37" stroke="#ffffff" />
                  <text x="60" y="15" fontSize="8" textAnchor="middle" fill="#ffffff">C1: 230x300</text>
                  <rect x="192" y="22" width="16" height="16" fill="#D4AF37" stroke="#ffffff" />
                  <text x="200" y="15" fontSize="8" textAnchor="middle" fill="#ffffff">C2: 230x300</text>
                  <rect x="332" y="22" width="16" height="16" fill="#D4AF37" stroke="#ffffff" />
                  <text x="340" y="15" fontSize="8" textAnchor="middle" fill="#ffffff">C3: 230x230</text>

                  <rect x="52" y="122" width="16" height="16" fill="#D4AF37" stroke="#ffffff" />
                  <text x="60" y="152" fontSize="8" textAnchor="middle" fill="#ffffff">C4: 230x230</text>
                  <rect x="192" y="122" width="16" height="16" fill="#D4AF37" stroke="#ffffff" />
                  <text x="200" y="152" fontSize="8" textAnchor="middle" fill="#ffffff">C5: 230x300</text>
                  <rect x="332" y="122" width="16" height="16" fill="#D4AF37" stroke="#ffffff" />
                  <text x="340" y="152" fontSize="8" textAnchor="middle" fill="#ffffff">C6: 230x230</text>

                  {/* Connecting Primary Beams */}
                  <line x1="60" y1="30" x2="340" y2="30" stroke="#ffffff" strokeWidth="2" />
                  <line x1="60" y1="130" x2="340" y2="130" stroke="#ffffff" strokeWidth="2" />
                  <line x1="60" y1="30" x2="60" y2="130" stroke="#ffffff" strokeWidth="2" />
                  <line x1="200" y1="30" x2="200" y2="130" stroke="#ffffff" strokeWidth="2" />
                  <line x1="340" y1="30" x2="340" y2="130" stroke="#ffffff" strokeWidth="2" />

                  {/* Central Courtyard Cutout Zone */}
                  <rect x="120" y="55" width="80" height="50" fill="#26352C" stroke="#D4AF37" strokeDasharray="2 2" />
                  <text x="160" y="82" fontSize="8" textAnchor="middle" fill="#D4AF37">COURTYARD OPENING</text>
                </svg>
              </div>

              <div className="flex justify-between items-center text-[10px] text-stone-300 border-t border-champagne/30 pt-2">
                <span>Max Beam Span: 4.88m • Raft Depth: 1.4m</span>
                <span className="text-emerald-400 font-bold">ILLUSTRATIVE EXAMPLE</span>
              </div>
            </motion.div>
          )}

          {/* Interactive Toggle Button */}
          {onToggleSkeleton && (
            <button
              onClick={onToggleSkeleton}
              className="absolute bottom-4 right-4 z-30 bg-black/75 hover:bg-black text-ivory-50 text-[11px] font-mono font-bold px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-md transition-all flex items-center space-x-1.5"
            >
              <ArchitecturalRulerIcon className="w-3.5 h-3.5 text-champagne" />
              <span>{showSkeleton ? 'View Living Render' : 'Inspect Structural Skeleton'}</span>
            </button>
          )}

          {/* Top Label */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white border border-white/20 shadow-sm flex items-center space-x-2 z-10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Bespoke 30×40 G+1 Specimen</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          SPREAD 1: STAGE 01 • BARE PLOT & SETBACK SURVEY
          ========================================================================= */}
      {stageIndex === 1 && (
        <div className="relative w-full h-full p-5 bg-[#F4F1EA] flex flex-col justify-between font-mono text-xs">
          <div className="flex justify-between items-center border-b border-stone-border pb-2 text-stone-muted">
            <span className="font-bold text-sage-900">STAGE 01: BARE PLOT & GIS SETBACK SURVEY</span>
            <span>MUMBAI 30×40 (9.14M × 12.19M)</span>
          </div>

          <div className="flex-1 flex items-center justify-center my-2">
            <svg className="w-full h-56" viewBox="0 0 540 240" fill="none">
              {/* Site Ground Mesh */}
              <defs>
                <pattern id="siteGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#D1CCC1" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect x="20" y="10" width="500" height="220" fill="url(#siteGrid)" rx="4" />

              {/* 30x40 Plot Boundary */}
              <rect x="50" y="25" width="440" height="180" stroke="#1A241E" strokeWidth="2" fill="#EAE6DC" fillOpacity="0.4" />
              <text x="270" y="20" fill="#1A241E" fontSize="9" textAnchor="middle" fontWeight="bold">NORTH ROAD (12.0M WIDTH) • 30'-0" FRONTAGE</text>
              <text x="35" y="120" fill="#1A241E" fontSize="8" textAnchor="middle" transform="rotate(-90 35 120)">40'-0" (12.19M)</text>

              {/* Setback Envelopes */}
              <rect x="90" y="55" width="360" height="130" stroke="#C5A059" strokeWidth="1.5" strokeDasharray="4 4" fill="#E3DDD0" fillOpacity="0.6" />
              <text x="270" y="47" fill="#C5A059" fontSize="8" textAnchor="middle" fontWeight="bold">FRONT SETBACK 3.0M</text>
              <text x="270" y="198" fill="#C5A059" fontSize="8" textAnchor="middle" fontWeight="bold">REAR SETBACK 2.0M</text>
              <text x="70" y="120" fill="#C5A059" fontSize="7" textAnchor="middle">1.5M</text>
              <text x="470" y="120" fill="#C5A059" fontSize="7" textAnchor="middle">1.5M</text>

              {/* Net Buildable Footprint */}
              <rect x="105" y="65" width="330" height="110" fill="#D5DDD4" fillOpacity="0.8" stroke="#26352C" strokeWidth="1.2" />
              <text x="270" y="115" fontSize="11" textAnchor="middle" fill="#1A241E" fontWeight="bold">NET BUILDABLE GROUND FOOTPRINT</text>
              <text x="270" y="132" fontSize="9" textAnchor="middle" fill="#4A6153">Max Permissible Coverage: 740 sqft / floor</text>

              {/* North Compass Rose Indicator */}
              <circle cx="490" cy="45" r="14" fill="#ffffff" stroke="#1A241E" strokeWidth="1" />
              <polygon points="490,34 494,45 490,42 486,45" fill="#C5A059" />
              <polygon points="490,56 494,45 490,42 486,45" fill="#1A241E" />
              <text x="490" y="31" fontSize="7" textAnchor="middle" fill="#1A241E" fontWeight="bold">N</text>
            </svg>
          </div>

          <div className="flex justify-between items-center text-[11px] text-sage-900 border-t border-stone-border pt-1.5">
            <span>GIS: 19.0760° N, 72.8777° E</span>
            <span className="text-emerald-700 font-bold">ILLUSTRATIVE EXAMPLE</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          SPREAD 2: STAGE 02 • 2D CAD BLUEPRINT FLOOR PLAN
          ========================================================================= */}
      {stageIndex === 2 && (
        <div className="relative w-full h-full p-5 bg-ivory-100 flex flex-col justify-between font-mono text-xs">
          <div className="flex justify-between items-center border-b border-stone-border pb-2 text-stone-muted">
            <span className="font-bold text-sage-900">STAGE 02: 2D ARCHITECTURAL CAD BLUEPRINT</span>
            <span>DRAWING: NEST-MUM-3040-A01</span>
          </div>

          <div className="flex-1 flex items-center justify-center my-2">
            <svg className="w-full h-56" viewBox="0 0 540 240" fill="none" stroke="#1A241E" strokeWidth="0.9">
              {/* Outer plot boundary */}
              <rect x="25" y="15" width="490" height="200" strokeDasharray="3 3" stroke="#8C867A" />
              <text x="270" y="27" fill="#8C867A" fontSize="8" textAnchor="middle">SETBACK PERIMETER ENVELOPE</text>

              {/* House Outline */}
              <rect x="50" y="38" width="440" height="160" fill="#ffffff" stroke="#1A241E" strokeWidth="1.5" />

              {/* Room 1: Living & Double-Height Courtyard */}
              <rect x="65" y="50" width="225" height="136" fill="#E5EBE3" fillOpacity="0.7" stroke="#26352C" strokeWidth="1" />
              <text x="177" y="110" fontSize="12" textAnchor="middle" fill="#1A241E" fontWeight="bold">Living & Courtyard Atrium</text>
              <text x="177" y="125" fontSize="9" textAnchor="middle" fill="#4A6153">5.2m × 4.0m • Honed Kota Floor</text>
              <rect x="135" y="65" width="85" height="40" fill="#D3DCD0" stroke="#C5A059" strokeDasharray="2 2" />
              <text x="177" y="88" fontSize="8" textAnchor="middle" fill="#C5A059" fontWeight="bold">OPEN ATRIUM</text>

              {/* Room 2: Ground Accessible Master */}
              <rect x="300" y="50" width="175" height="75" fill="#EFECE4" fillOpacity="0.8" stroke="#26352C" strokeWidth="1" />
              <text x="387" y="85" fontSize="11" textAnchor="middle" fill="#1A241E" fontWeight="bold">Ground Master Suite</text>
              <text x="387" y="98" fontSize="8" textAnchor="middle" fill="#756E63">4.0m × 3.5m • Zero-Step</text>

              {/* Room 3: Agneya Kitchen */}
              <rect x="300" y="130" width="175" height="56" fill="#E5E1D6" fillOpacity="0.8" stroke="#26352C" strokeWidth="1" />
              <text x="387" y="157" fontSize="10" textAnchor="middle" fill="#1A241E" fontWeight="bold">Agneya Kitchen & Utility</text>
              <text x="387" y="170" fontSize="8" textAnchor="middle" fill="#756E63">3.2m × 2.6m • Southeast Vastu</text>

              {/* Dimension Strings */}
              <line x1="50" y1="210" x2="490" y2="210" stroke="#1A241E" strokeWidth="1" />
              <text x="270" y="222" fill="#1A241E" fontSize="9" textAnchor="middle">TOTAL BUILT-UP: 1,480 SQFT (G+1)</text>
            </svg>
          </div>

          <div className="flex justify-between items-center text-[11px] text-sage-900 border-t border-stone-border pt-1.5">
            <span>SCALE: 1:100 @ A3</span>
            <span className="text-emerald-700 font-bold">ILLUSTRATIVE EXAMPLE</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          SPREAD 3: STAGE 03 • 3D BIM STRUCTURAL FRAMEWORK
          ========================================================================= */}
      {stageIndex === 3 && (
        <div className="relative w-full h-full p-5 bg-[#17201B] text-champagne flex flex-col justify-between font-mono text-xs">
          <div className="flex justify-between items-center border-b border-champagne/30 pb-2 text-stone-300">
            <span className="font-bold text-white">STAGE 03: 3D BIM STRUCTURAL RCC FRAMEWORK</span>
            <span className="text-champagne">IS 456 LIMIT STATE</span>
          </div>

          <div className="flex-1 flex items-center justify-center my-2">
            <svg className="w-full h-56" viewBox="0 0 540 240" fill="none">
              {/* Foundation Plinth */}
              <polygon points="70,180 270,225 470,180 270,135" fill="#26352C" stroke="#4A6153" strokeWidth="1.5" />
              <text x="270" y="200" fill="#A8BFAC" fontSize="9" textAnchor="middle">1.4M SOLID RCC RAFT FOUNDATION</text>

              {/* RCC Columns Rising Upwards (C1 to C6) */}
              {/* C1 Left Rear */}
              <line x1="120" y1="165" x2="120" y2="70" stroke="#D4AF37" strokeWidth="4" />
              <text x="110" y="65" fill="#ffffff" fontSize="8">C1: 230×300</text>

              {/* C2 Center Rear */}
              <line x1="270" y1="145" x2="270" y2="50" stroke="#D4AF37" strokeWidth="4" />
              <text x="270" y="42" fill="#ffffff" fontSize="8" textAnchor="middle">C2: 230×300 (15.6T Axial)</text>

              {/* C3 Right Rear */}
              <line x1="420" y1="165" x2="420" y2="70" stroke="#D4AF37" strokeWidth="4" />
              <text x="430" y="65" fill="#ffffff" fontSize="8">C3: 230×230</text>

              {/* C4 Left Front */}
              <line x1="120" y1="195" x2="120" y2="100" stroke="#D4AF37" strokeWidth="4" />
              <text x="110" y="105" fill="#ffffff" fontSize="8">C4: 230×230</text>

              {/* C5 Center Front */}
              <line x1="270" y1="215" x2="270" y2="120" stroke="#D4AF37" strokeWidth="4" />
              <text x="270" y="130" fill="#ffffff" fontSize="8" textAnchor="middle">C5: 230×300</text>

              {/* C6 Right Front */}
              <line x1="420" y1="195" x2="420" y2="100" stroke="#D4AF37" strokeWidth="4" />
              <text x="430" y="105" fill="#ffffff" fontSize="8">C6: 230×230</text>

              {/* First-Floor Concrete Slab & Tie Beams */}
              <polygon points="70,95 270,140 470,95 270,50" fill="#3D5245" fillOpacity="0.7" stroke="#ffffff" strokeWidth="1.5" />
              <text x="270" y="98" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">FIRST FLOOR RCC SLAB (125MM TIE GRID)</text>

              {/* Load Tributary Arcs */}
              <path d="M 170 120 Q 220 135 270 120" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2 2" />
              <text x="220" y="142" fill="#D4AF37" fontSize="7" textAnchor="middle">SPAN / 16 DEFLECTION LIMIT PASSED</text>
            </svg>
          </div>

          <div className="flex justify-between items-center text-[11px] text-stone-300 border-t border-champagne/30 pt-1.5">
            <span>BEARING: ASSUMED, CONFIRM ON SITE</span>
            <span className="text-emerald-400 font-bold">ILLUSTRATIVE EXAMPLE</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          SPREAD 4: STAGE 04 • MODERN ENCLOSURE & BURMA TEAK LOUVERS
          ========================================================================= */}
      {stageIndex === 4 && (
        <div className="relative w-full h-full">
          <img
            src="/images/home/living_courtyard.png"
            alt="Board-Formed Concrete Walls and Louvered Teak Shading Atrium"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          {/* Subtle architectural grid */}
          <div className="absolute inset-0 bg-architectural-grid opacity-25 pointer-events-none" />

          {/* Top Stage Tag */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white border border-white/20 shadow-sm flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Stage 04: Modernist Enclosure & Teak Louvers</span>
          </div>

          {/* Bottom Floating Material Tag */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-white border border-white/20 flex justify-between items-center font-mono">
            <span>Double-Height Courtyard • Teak Louvers Mitigate 68% Solar Heat</span>
            <span className="text-champagne font-bold">PASSIVE COOLING</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          SPREAD 5: STAGE 05 • FINISHES, LIVING REALITY & TURNKEY BOQ
          ========================================================================= */}
      {stageIndex === 5 && (
        <div className="relative w-full h-full">
          <img
            src="/images/home/tactile_materials.png"
            alt="Tactile Architectural Material Palette with Honed Kota Stone and Teak"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />

          {/* Top Stage Tag */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white border border-white/20 shadow-sm flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Stage 05: Tactile Material Palette & Bank BOQ</span>
          </div>

          {/* Live BOQ Metric Strip */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-stone-border shadow-lg flex justify-between items-center text-xs font-mono">
            <div>
              <span className="font-bold text-sage-900 block">ITEMIZED BOQ (EXAMPLE)</span>
              <span className="text-[10px] text-stone-muted">Cement bags • TMT steel • stage-wise payments</span>
            </div>
            <span className="bg-sage-900 text-ivory-50 px-2.5 py-1 rounded-full text-[10px] font-bold">
              0% COST OVERRUNS
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
