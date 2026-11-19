'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TSquareIcon, PlumbBobIcon, ShieldVerifiedIcon, AcousticWaveIcon } from './BespokeIcons';

interface AdaptationProfile {
  id: string;
  name: string;
  category: string;
  tagline: string;
  imageSrc: string;
  imageAlt: string;
  features: { label: string; desc: string; metric: string }[];
  blueprintLayout: {
    rooms: { name: string; dim: string; tag: string }[];
    annotation: string;
  };
}

const ADAPTATIONS: AdaptationProfile[] = [
  {
    id: 'multigen',
    name: 'Multi-Generational Haven',
    category: 'Senior Living Focus',
    tagline: 'Zero daily stair climbing for aging parents, with direct access to a private morning garden.',
    imageSrc: '/images/home/garden_suite.png',
    imageAlt: 'Ground-Floor Accessible Master Bedroom with Garden View',
    features: [
      {
        label: 'Zero-Step Threshold',
        desc: 'Completely flush transition from bedroom to bathroom to courtyard garden patio.',
        metric: '0.0mm Step Height'
      },
      {
        label: 'Accessible Clearances',
        desc: '950mm wide clear door openings accommodating wheelchair turning radiuses.',
        metric: '950mm Clear Openings'
      },
      {
        label: 'Natural Honed Kota Stone',
        desc: 'Leather-finish stone provides R11 slip resistance even in monsoon humidity.',
        metric: 'R11 Non-Slip Grip'
      }
    ],
    blueprintLayout: {
      rooms: [
        { name: 'Ground Master Suite', dim: '4.2m × 3.8m', tag: 'Zero-Step Access' },
        { name: 'Accessible Ensuite', dim: '2.8m × 2.4m', tag: '950mm Doorway' },
        { name: 'Morning Garden Patio', dim: '3.6m × 2.4m', tag: 'Direct Courtyard' }
      ],
      annotation: 'Universal Accessibility Protocol • Zero Stair Elevation'
    }
  },
  {
    id: 'wfh',
    name: 'Acoustic Studio Pod',
    category: 'WFH & Sound Isolation',
    tagline: 'Decoupled acoustic drywall and independent client foyer for high-focus executives and creators.',
    imageSrc: '/images/home/wfh_studio.png',
    imageAlt: 'Acoustic North-Light Executive Architectural Studio',
    features: [
      {
        label: 'STC-48 Sound Isolation',
        desc: 'Double-stud acoustic partition deadens external road traffic down to a quiet 32 dB.',
        metric: 'STC-48 Sound Rating'
      },
      {
        label: 'Dedicated Client Entry',
        desc: 'Direct side porch access allows visiting clients without crossing domestic family rooms.',
        metric: '100% Zoned Privacy'
      },
      {
        label: 'Indirect North Daylight',
        desc: 'Calculated 42° indirect north skylight eliminates screen glare across 10-hour workdays.',
        metric: '500 Lux Glare-Free'
      }
    ],
    blueprintLayout: {
      rooms: [
        { name: 'Executive Studio & Pod', dim: '4.5m × 3.6m', tag: 'STC-48 Isolation' },
        { name: 'Client Foyer & Porch', dim: '2.6m × 2.2m', tag: 'Independent Entry' },
        { name: 'Acoustic Buffer Lounge', dim: '3.8m × 2.6m', tag: 'Sound Lock Door' }
      ],
      annotation: 'Acoustic Isolation Protocol • Dual-Zoned Circulation'
    }
  },
  {
    id: 'toddler',
    name: 'Open Courtyard Atrium',
    category: 'Child & Pet Friendly',
    tagline: 'Expansive 360° sightlines from the kitchen island to the grass courtyard, with soft rounded edges.',
    imageSrc: '/images/home/living_courtyard.png',
    imageAlt: 'Sun-Drenched Double-Height Living Room with Central Courtyard',
    features: [
      {
        label: 'Continuous Sightlines',
        desc: 'Unobstructed visual oversight of all play and garden zones directly from the cooking island.',
        metric: '100% Visual Sightline'
      },
      {
        label: 'Bullnose Soft Corners',
        desc: 'All internal masonry arrises rounded to a 25mm radius to prevent collision injuries.',
        metric: '25mm Radius Edges'
      },
      {
        label: 'Slaked Lime Wall Wash',
        desc: 'Breathable, VOC-free natural mineral plaster suppresses mold spores and allergens.',
        metric: '0.0% VOC Toxicity'
      }
    ],
    blueprintLayout: {
      rooms: [
        { name: 'Open Kitchen & Island', dim: '4.0m × 3.2m', tag: 'Direct Sightline' },
        { name: 'Sunlit Central Atrium', dim: '4.2m × 3.6m', tag: 'Soft Grass Play' },
        { name: 'Double-Height Living', dim: '5.2m × 4.0m', tag: 'Bullnose Edges' }
      ],
      annotation: 'Child-Safe Ergonomic Protocol • Breathable Natural Finishes'
    }
  }
];

export default function FamilyAdaptationShowcase() {
  const [activeTab, setActiveTab] = useState<string>('multigen');
  const current = ADAPTATIONS.find(a => a.id === activeTab) || ADAPTATIONS[0];

  return (
    <section id="adaptations" className="py-20 px-6 md:px-12 lg:px-20 bg-white border-b border-stone-border">
      <div className="w-full max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-border pb-8 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-champagne bg-ivory-100 px-3.5 py-1.5 rounded-full border border-stone-border">
              <TSquareIcon className="w-3.5 h-3.5 text-sage-800" />
              <span>Chapter 02 • Spatial Adaptation Engine</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-sage-900 tracking-tight">
              Three Real Lives. One 30×40 Canvas.
            </h2>
            <p className="text-sm md:text-base text-stone-muted max-w-2xl leading-relaxed">
              Witness how Nestora adjusts structural walls, door clearances, and acoustics for different living realities on the exact same plot.
            </p>
          </div>

          {/* Interactive Profile Tabs */}
          <div className="flex items-center space-x-2 bg-ivory-100 p-1.5 rounded-2xl border border-stone-border flex-wrap gap-y-1">
            {ADAPTATIONS.map((ad) => (
              <button
                key={ad.id}
                onClick={() => setActiveTab(ad.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === ad.id
                    ? 'bg-sage-900 text-ivory-50 shadow-md scale-[1.02]'
                    : 'text-sage-800 hover:text-sage-900 hover:bg-white/60'
                }`}
              >
                {ad.category}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Adaptation Content Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Photorealistic Render Showcase */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl overflow-hidden border border-stone-border shadow-xl bg-ivory-200 aspect-[16/11]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={current.id}
                  src={current.imageSrc}
                  alt={current.imageAlt}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </AnimatePresence>

              {/* Ambient Grid Fallback */}
              <div className="absolute inset-0 bg-architectural-grid opacity-20 pointer-events-none" />

              {/* Top Badge */}
              <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-border text-xs font-bold text-sage-900 shadow-sm">
                <span>{current.category}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Key Specifications & Room Allocation */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-champagne block mb-1">
                Spatial Blueprint Allocation
              </span>
              <h3 className="text-2xl font-black text-sage-900">{current.name}</h3>
              <p className="text-sm text-stone-muted mt-2 leading-relaxed">{current.tagline}</p>
            </div>

            {/* Room Allocations Card */}
            <div className="bg-ivory-100 p-4 rounded-2xl border border-stone-border space-y-2">
              <div className="text-[10px] uppercase font-bold text-stone-muted tracking-wider mb-2">
                Room Layout Configuration
              </div>
              {current.blueprintLayout.rooms.map((r, i) => (
                <div key={i} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-stone-border/70">
                  <span className="font-bold text-sage-900">{r.name} ({r.dim})</span>
                  <span className="text-[10px] font-semibold text-sage-800 bg-sage-50 px-2 py-0.5 rounded border border-sage-200">
                    {r.tag}
                  </span>
                </div>
              ))}
            </div>

            {/* Feature Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {current.features.map((f, i) => (
                <div key={i} className="bg-white p-3.5 rounded-2xl border border-stone-border shadow-xs">
                  <span className="text-xs font-black text-sage-900 block">{f.metric}</span>
                  <p className="text-[10px] text-stone-muted mt-1 leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs text-stone-muted flex items-center space-x-1.5">
              <PlumbBobIcon className="w-3.5 h-3.5 text-sage-800" />
              <span>Zero templates. Constraint graph recalculated in real time.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
