'use client';

import React, { useState } from 'react';
import { 
  CantileverBeamIcon, 
  ShieldVerifiedIcon, 
  ArchitecturalRulerIcon, 
  SunArcIcon 
} from './BespokeIcons';

interface MaterialSpec {
  id: string;
  name: string;
  origin: string;
  category: string;
  density: string;
  slipRating: string;
  thermal: string;
  quote: string;
  colorHex: string;
}

const MATERIALS: MaterialSpec[] = [
  {
    id: 'kota',
    name: 'Honed Rajasthan Kota Stone',
    origin: 'Kota District, Rajasthan',
    category: 'Flooring & Plinth',
    density: '2650 kg/m³',
    slipRating: 'R11 Non-Slip',
    thermal: 'High Thermal Mass (Keeps interior 4°C cooler in Mumbai summers)',
    quote: 'Natural limestone quarried from Rajasthan. Satin-smooth under bare feet with zero slip risk for elderly family members, even in heavy monsoon moisture.',
    colorHex: '#8C9B90'
  },
  {
    id: 'teak',
    name: 'Reclaimed Burma Teak',
    origin: 'Decades-Seasoned Timber',
    category: 'Joinery & Louvers',
    density: '660 kg/m³',
    slipRating: 'Grade-A Seasoned',
    thermal: 'Low Conductivity (0.13 W/mK)',
    quote: 'High natural oil content repels coastal humidity and termite infestation. Adds rich tactile warmth to shading louvers and window reveals.',
    colorHex: '#A26D3F'
  },
  {
    id: 'lime',
    name: 'Hydraulic Slaked Lime Plaster',
    origin: 'Natural Calcined Mineral',
    category: 'Breathable Wall Finishes',
    density: '1400 kg/m³',
    slipRating: '0.0 VOC Toxicity',
    thermal: 'High Vapour Permeability',
    quote: 'Ancient hydraulic lime plaster that breathes naturally, preventing trapped wall condensation and naturally suppressing mold spores in humid coastal air.',
    colorHex: '#EAE6DC'
  },
  {
    id: 'terrazzo',
    name: 'Cast River Pebble Terrazzo',
    origin: 'Hand-Poured Aggregate',
    category: 'Kitchen & Wet Zones',
    density: '2400 kg/m³',
    slipRating: 'Seamless Stain-Proof',
    thermal: 'High Scratch Resistance',
    quote: 'Monolithic aggregate flooring without porous grout joints. Effortless to sanitize against domestic oil and spice spills.',
    colorHex: '#D5CEC5'
  }
];

export default function TactileMaterialFlatlay() {
  const [selected, setSelected] = useState<MaterialSpec>(MATERIALS[0]);

  return (
    <section className="py-20 px-6 md:px-12 lg:px-20 bg-[#F7F6F2] border-b border-stone-border">
      <div className="w-full max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="border-b border-stone-border pb-6 space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-champagne bg-white px-3.5 py-1.5 rounded-full border border-stone-border">
            <CantileverBeamIcon className="w-3.5 h-3.5 text-sage-800" />
            <span>Chapter 03 • Tactile Materiality & Physics</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-sage-900 tracking-tight">
            Honest Materials. Proven Physics.
          </h2>
          <p className="text-sm md:text-base text-stone-muted max-w-2xl leading-relaxed">
            Every surface in the Nestora palette is chosen for thermal inertia, acoustic dampening, and graceful natural weathering over decades.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Material Flatlay Photography */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl overflow-hidden border border-stone-border shadow-xl bg-ivory-200 aspect-[16/11]">
              <img
                src="/images/home/tactile_materials.png"
                alt="Architectural Material Moodboard Flatlay with Kota Stone, Teak, and Terrazzo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-architectural-grid opacity-25 pointer-events-none" />

              <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-border text-xs font-bold text-sage-900 shadow-sm">
                <span>Natural Mineral Palette Flatlay</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Material Selector & Specifications */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Material Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selected.id === m.id
                      ? 'bg-white border-sage-900 shadow-md scale-[1.02]'
                      : 'bg-white/60 border-stone-border hover:bg-white hover:border-sage-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div 
                      className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: m.colorHex }}
                    />
                    <div className="text-xs font-bold text-sage-900 truncate">{m.name}</div>
                  </div>
                  <div className="text-[10px] text-stone-muted mt-1">{m.category}</div>
                </button>
              ))}
            </div>

            {/* Selected Spec Detail Box */}
            <div className="bg-white p-6 rounded-3xl border border-stone-border shadow-md space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-stone-border">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-champagne">
                    Material Specification
                  </span>
                  <h4 className="text-xl font-black text-sage-900 mt-1">{selected.name}</h4>
                  <div className="text-xs text-stone-muted mt-0.5">{selected.origin}</div>
                </div>
                <div 
                  className="w-10 h-10 rounded-xl border border-black/10 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: selected.colorHex }}
                />
              </div>

              <p className="text-xs md:text-sm text-sage-800 italic leading-relaxed">
                &ldquo;{selected.quote}&rdquo;
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-ivory-100 p-3 rounded-xl border border-stone-border">
                  <span className="text-[10px] uppercase font-bold text-stone-muted block">Density & Mass</span>
                  <span className="text-xs font-bold text-sage-900 mt-0.5 block">{selected.density}</span>
                </div>
                <div className="bg-ivory-100 p-3 rounded-xl border border-stone-border">
                  <span className="text-[10px] uppercase font-bold text-stone-muted block">Thermal Property</span>
                  <span className="text-xs font-bold text-sage-900 mt-0.5 block">{selected.thermal}</span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="space-y-2 pt-3 border-t border-stone-border text-xs text-sage-800">
                <div className="flex items-center space-x-2">
                  <ShieldVerifiedIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Validated Structural Integrity:</strong> Local soil bearing load computed.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArchitecturalRulerIcon className="w-4 h-4 text-sage-800 flex-shrink-0" />
                  <span><strong>Municipal Precision Assured:</strong> MCGM setback envelope verified.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <SunArcIcon className="w-4 h-4 text-champagne flex-shrink-0" />
                  <span><strong>Climate & Acoustic Comfort:</strong> Shading overhangs cut peak solar heat.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
