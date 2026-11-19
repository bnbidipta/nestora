'use client';

import React, { useState } from 'react';
import { TSquareIcon, PlumbBobIcon, ShieldVerifiedIcon, ArchitecturalRulerIcon, AcousticWaveIcon } from './BespokeIcons';

interface FamilyVariant {
  id: string;
  name: string;
  subhead: string;
  badge: string;
  themeColor: string;
  keyFeatures: { title: string; desc: string; metric: string }[];
  rooms: { name: string; dim: string; width: string; height: string; top: string; left: string; tag: string }[];
}

const VARIANTS: FamilyVariant[] = [
  {
    id: 'multigen',
    name: 'Multi-Generational Sanctuary',
    subhead: 'Eliminates 100% of daily stairs for aging parents while providing private ensuite living.',
    badge: 'Senior Accessibility',
    themeColor: 'amber',
    keyFeatures: [
      {
        title: 'Zero-Threshold Ground Suite',
        desc: 'Flush thresholds from entry to living to bedroom. Eliminates trips and daily stair climbing.',
        metric: '0 Stair Climbs'
      },
      {
        title: 'Wheelchair Clearances',
        desc: 'All internal doorways widened to 950mm with a 1200mm turning diameter in ensuite bath.',
        metric: '950mm Clear Doors'
      },
      {
        title: 'Tactile Honed Kota Flooring',
        desc: 'R11 anti-slip textured natural stone maintains maximum grip even in humid monsoon seasons.',
        metric: 'R11 Slip Resistance'
      }
    ],
    rooms: [
      { name: 'Ground Master Suite', dim: '4.2m × 3.8m', width: '48%', height: '54%', top: '8%', left: '6%', tag: 'Zero-Step Entry' },
      { name: 'Accessible Ensuite', dim: '2.8m × 2.4m', width: '36%', height: '42%', top: '8%', left: '58%', tag: '950mm Clear Door' },
      { name: 'Central Living Corridor', dim: '8.4m × 2.6m', width: '88%', height: '28%', top: '66%', left: '6%', tag: '1200mm Turning Circle' }
    ]
  },
  {
    id: 'wfh',
    name: 'Acoustic Studio Pod',
    subhead: 'Engineered for remote creators and professionals requiring absolute acoustic stillness.',
    badge: 'WFH & Sound Isolation',
    themeColor: 'sage',
    keyFeatures: [
      {
        title: 'STC-48 Sound Isolation',
        desc: 'Decoupled double-stud partitions with high-density mineral wool deaden road traffic noise to 32 dB.',
        metric: 'STC-48 Isolation'
      },
      {
        title: 'Dedicated Client Foyer',
        desc: 'Separate side entrance allows visiting clients to consult in the studio without entering domestic family spaces.',
        metric: '100% Zoned Privacy'
      },
      {
        title: 'Diffused North Daylight',
        desc: 'Calculated 42° indirect north skylight eliminates monitor glare during 10-hour screen sessions.',
        metric: '500 Lux Glare-Free'
      }
    ],
    rooms: [
      { name: 'Executive Studio & Pod', dim: '4.5m × 3.6m', width: '52%', height: '54%', top: '8%', left: '6%', tag: 'STC-48 Sound Barrier' },
      { name: 'Client Foyer & Porch', dim: '2.6m × 2.2m', width: '32%', height: '38%', top: '8%', left: '62%', tag: 'Independent Entry' },
      { name: 'Acoustic Buffer Corridor', dim: '8.8m × 2.4m', width: '88%', height: '28%', top: '66%', left: '6%', tag: 'Double Sound Seal' }
    ]
  },
  {
    id: 'toddler',
    name: 'Open Courtyard Atrium',
    subhead: 'Designed for young children and pets with expansive sightlines and non-toxic materials.',
    badge: 'Child & Pet Friendly',
    themeColor: 'emerald',
    keyFeatures: [
      {
        title: 'Continuous Kitchen Sightline',
        desc: 'Open island vantage point maintains 100% visual contact with toddler play lawn and central courtyard.',
        metric: '100% Sightline Oversight'
      },
      {
        title: 'Bullnose Soft Corners',
        desc: 'All internal masonry arrises rounded to a 25mm radius to eliminate sharp corner collision injuries.',
        metric: '25mm Radius Edges'
      },
      {
        title: 'Non-Toxic Slaked Lime Plaster',
        desc: 'Natural mineral wall finishes emit 0.0 VOCs and naturally suppress indoor allergens and mold.',
        metric: '0.0% VOC Toxicity'
      }
    ],
    rooms: [
      { name: 'Open Kitchen & Island', dim: '4.0m × 3.2m', width: '42%', height: '52%', top: '8%', left: '6%', tag: 'Direct Play Sightline' },
      { name: 'Sunlit Central Atrium', dim: '4.2m × 3.6m', width: '44%', height: '52%', top: '8%', left: '50%', tag: 'Soft Grass Play Zone' },
      { name: 'Connected Garden Hall', dim: '8.8m × 2.6m', width: '88%', height: '28%', top: '66%', left: '6%', tag: 'Bullnose Arris Edges' }
    ]
  }
];

export default function FamilyComparisonSlider() {
  const [selectedLeft, setSelectedLeft] = useState<string>('multigen');
  const [selectedRight, setSelectedRight] = useState<string>('wfh');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const leftVariant = VARIANTS.find(v => v.id === selectedLeft) || VARIANTS[0];
  const rightVariant = VARIANTS.find(v => v.id === selectedRight) || VARIANTS[1];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pos = Math.max(15, Math.min(85, (x / rect.width) * 100));
    setSliderPosition(pos);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-stone-border p-6 md:p-10 shadow-xl select-none">
      {/* Top Drafting Desk Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-6 mb-6 border-b border-stone-border gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-widest text-champagne mb-2">
            <TSquareIcon className="w-4 h-4 text-sage-800" />
            <span>Chapter 02 • Spatial Adaptation Engine</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-sage-900 tracking-tight">
            Same 30×40 Plot. Three Radically Different Homes.
          </h3>
          <p className="text-sm text-stone-muted mt-2 max-w-2xl leading-relaxed">
            Drag the central slider to inspect how the floor plan, door widths, wall STC ratings, and circulation corridors automatically adapt to specific family realities.
          </p>
        </div>

        {/* Archetype Quick Selectors */}
        <div className="flex items-center space-x-2 bg-ivory-100 p-1.5 rounded-2xl border border-stone-border">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                if (selectedLeft === v.id) return;
                setSelectedRight(v.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedRight === v.id
                  ? 'bg-sage-900 text-ivory-50 shadow-sm'
                  : 'text-sage-800 hover:text-sage-900 hover:bg-white/60'
              }`}
            >
              {v.badge}
            </button>
          ))}
        </div>
      </div>

      {/* Drafting Ruler Ticks (Top) */}
      <div className="relative w-full h-5 border-t border-b border-stone-border/80 flex items-center justify-between px-4 text-[9px] font-mono text-stone-muted bg-ivory-100/60 mb-2">
        <span>| 0.0m</span>
        <span>| 2.5m</span>
        <span>| 5.0m</span>
        <span>| 7.5m</span>
        <span>| 10.0m</span>
        <span>| 12.0m</span>
      </div>

      {/* Interactive Split Drafting Desk Canvas */}
      <div 
        className="relative w-full h-[480px] md:h-[430px] rounded-2xl overflow-hidden border border-stone-border cursor-ew-resize bg-architectural-grid bg-[#FCFCFA]"
        onMouseMove={handleMouseMove}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {/* RIGHT LAYER (Underneath) */}
        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between bg-sage-50/40">
          <div className="flex justify-end">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sage-800 bg-white px-3 py-1 rounded-full border border-sage-300 shadow-sm">
                Right Side: {rightVariant.badge}
              </span>
              <h4 className="text-xl font-black text-sage-900 mt-2">{rightVariant.name}</h4>
              <p className="text-xs text-stone-muted max-w-sm mt-1">{rightVariant.subhead}</p>
            </div>
          </div>

          {/* Right Blueprint Silhouette */}
          <div className="relative w-full h-48 border border-dashed border-sage-400/80 rounded-xl p-3 bg-white/80 backdrop-blur-sm shadow-inner">
            {rightVariant.rooms.map((r, i) => (
              <div
                key={i}
                className="absolute border border-sage-700/60 bg-sage-100/60 rounded-lg flex flex-col justify-center items-center p-2 text-center transition-all shadow-sm"
                style={{ width: r.width, height: r.height, top: r.top, left: r.left }}
              >
                <span className="text-[11px] font-bold text-sage-900 leading-tight">{r.name}</span>
                <span className="text-[9px] font-mono text-stone-muted">{r.dim}</span>
                <span className="text-[8px] font-bold text-sage-800 bg-white px-1.5 py-0.5 rounded mt-1 border border-sage-300 shadow-2xs">
                  {r.tag}
                </span>
              </div>
            ))}
          </div>

          {/* Right Metrics Strip */}
          <div className="grid grid-cols-3 gap-2.5">
            {rightVariant.keyFeatures.map((f, i) => (
              <div key={i} className="bg-white/95 p-3 rounded-xl border border-sage-200 shadow-sm">
                <span className="text-xs font-bold text-sage-900 block">{f.metric}</span>
                <p className="text-[10px] text-stone-muted mt-0.5 line-clamp-1">{f.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LEFT LAYER (Clipped by slider position) */}
        <div 
          className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between bg-amber-50/40 border-r border-stone-border"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        >
          <div className="flex justify-start">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">
                Left Side: {leftVariant.badge}
              </span>
              <h4 className="text-xl font-black text-sage-900 mt-2">{leftVariant.name}</h4>
              <p className="text-xs text-stone-muted max-w-sm mt-1">{leftVariant.subhead}</p>
            </div>
          </div>

          {/* Left Blueprint Silhouette */}
          <div className="relative w-full h-48 border border-dashed border-amber-400/80 rounded-xl p-3 bg-white/80 backdrop-blur-sm shadow-inner">
            {leftVariant.rooms.map((r, i) => (
              <div
                key={i}
                className="absolute border border-amber-700/60 bg-amber-100/60 rounded-lg flex flex-col justify-center items-center p-2 text-center transition-all shadow-sm"
                style={{ width: r.width, height: r.height, top: r.top, left: r.left }}
              >
                <span className="text-[11px] font-bold text-sage-900 leading-tight">{r.name}</span>
                <span className="text-[9px] font-mono text-stone-muted">{r.dim}</span>
                <span className="text-[8px] font-bold text-amber-900 bg-white px-1.5 py-0.5 rounded mt-1 border border-amber-300 shadow-2xs">
                  {r.tag}
                </span>
              </div>
            ))}
          </div>

          {/* Left Metrics Strip */}
          <div className="grid grid-cols-3 gap-2.5">
            {leftVariant.keyFeatures.map((f, i) => (
              <div key={i} className="bg-white/95 p-3 rounded-xl border border-amber-200 shadow-sm">
                <span className="text-xs font-bold text-amber-950 block">{f.metric}</span>
                <p className="text-[10px] text-stone-muted mt-0.5 line-clamp-1">{f.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Central Draggable Architectural Divider */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-sage-900 pointer-events-none shadow-2xl z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-sage-900 text-ivory-50 flex items-center justify-center shadow-2xl border-2 border-white">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6" />
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Architectural Notation */}
      <div className="mt-4 flex items-center justify-between text-xs text-stone-muted">
        <span className="flex items-center space-x-1.5">
          <PlumbBobIcon className="w-3.5 h-3.5 text-sage-800" />
          <span>Zero templates. Custom constraint graph generated dynamically per family brief.</span>
        </span>
        <span className="hidden sm:inline font-mono text-[11px]">↔ Drag divider horizontally to compare adaptations</span>
      </div>
    </div>
  );
}
