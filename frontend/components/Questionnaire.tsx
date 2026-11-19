'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Users, 
  Sliders, 
  CloudSun, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ShieldAlert, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { createHouse, submitQuestionnaire } from '@/lib/api';

export default function Questionnaire() {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    user_prompt: "Modern home for 3 generations with easy elder mobility and pet-friendly finishes.",
    plot_width_ft: 30.0,
    plot_depth_ft: 40.0,
    target_budget_inr: 2000000.0,
    adults: 3,
    elders: 1,
    toddlers: 1,
    has_pets: true,
    pet_breed: "Labrador",
    elder_knee_pain: true,
    wfh_hours_per_day: 8,
    cooking_style: "wet_and_dry",
    vaastu_faith: "vaastu_soft",
    preferred_styles: ["japanese", "forest"]
  });

  const [activeConstraints, setActiveConstraints] = useState<string[]>([
    "Ground Floor Bedroom Mandatory",
    "Clear Door Width >= 900mm",
    "Zero-Step Thresholds",
    "Anti-Scratch Flooring"
  ]);

  const handleElderToggle = (val: boolean) => {
    setFormData(prev => ({ ...prev, elder_knee_pain: val }));
    if (val) {
      if (!activeConstraints.includes("Ground Floor Bedroom Mandatory")) {
        setActiveConstraints(prev => [...prev, "Ground Floor Bedroom Mandatory", "Clear Door Width >= 900mm", "Zero-Step Thresholds"]);
      }
    } else {
      setActiveConstraints(prev => prev.filter(c => !["Ground Floor Bedroom Mandatory", "Clear Door Width >= 900mm", "Zero-Step Thresholds"].includes(c)));
    }
  };

  const handleStyleToggle = (style: string) => {
    setFormData(prev => {
      const styles = prev.preferred_styles.includes(style)
        ? prev.preferred_styles.filter(s => s !== style)
        : [...prev.preferred_styles, style];
      return { ...prev, preferred_styles: styles.length ? styles : ["japanese"] };
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // 1. Create draft House Twin
      const houseId = await createHouse({
        plot: {
          address: "Mumbai, 19.07, 72.87",
          plot_width_ft: formData.plot_width_ft,
          plot_depth_ft: formData.plot_depth_ft,
          plot_area_sqft: formData.plot_width_ft * formData.plot_depth_ft
        },
        family: {
          adults: formData.adults,
          elders: formData.elders,
          toddlers: formData.toddlers,
          wfh_members: formData.wfh_hours_per_day > 4 ? 1 : 0
        },
        budget: {
          total_budget_inr: formData.target_budget_inr
        }
      });

      // 2. Submit questionnaire answers to SLM
      await submitQuestionnaire(houseId, formData);

      // 3. Route to Screen 3 Swipe Deck
      router.push(`/swipe?house_id=${houseId}`);
    } catch (err: any) {
      alert(`Error submitting questionnaire: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Progress Bar Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>STAGE {currentStage} OF 4</span>
          <span className="text-blue-400">{currentStage * 25}% COMPLETE</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-amber-400 transition-all duration-300"
            style={{ width: `${currentStage * 25}%` }}
          />
        </div>

        {/* Tab Headers */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-medium">
          <div className={`p-2 rounded-lg border ${currentStage === 1 ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-slate-800 text-slate-500'}`}>
            1. Where & What
          </div>
          <div className={`p-2 rounded-lg border ${currentStage === 2 ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-slate-800 text-slate-500'}`}>
            2. Who Lives
          </div>
          <div className={`p-2 rounded-lg border ${currentStage === 3 ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-slate-800 text-slate-500'}`}>
            3. Lifestyle
          </div>
          <div className={`p-2 rounded-lg border ${currentStage === 4 ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-slate-800 text-slate-500'}`}>
            4. Site Physics
          </div>
        </div>
      </div>

      {/* Dynamic Constraint Badge Bar */}
      {activeConstraints.length > 0 && (
        <div className="mb-6 rounded-xl border border-blue-900/60 bg-blue-950/30 p-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>ACTIVE ARCHITECTURAL CONSTRAINTS EXTRACTED:</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeConstraints.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded bg-blue-900/40 px-2 py-0.5 font-mono text-[10px] text-blue-200 border border-blue-700/50">
                <Check className="h-2.5 w-2.5 text-emerald-400" />
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stage Container */}
      <div className="rounded-2xl border border-slate-800 bg-[#131926] p-6 sm:p-8">
        {/* STAGE 1: Where & What */}
        {currentStage === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                <span>Stage 1: Where & What Are You Building?</span>
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Locked pilot jurisdiction: Mumbai Municipal Corporation (MCGM DCR 2034).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-mono text-slate-400">TARGET CITY / JURISDICTION</label>
                <input 
                  type="text" 
                  value="Mumbai, Maharashtra (19.07°N, 72.87°E)" 
                  disabled
                  className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400">BASE BUDGET ESTIMATE (INR)</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-2 text-sm text-slate-400">₹</span>
                  <input 
                    type="number" 
                    value={formData.target_budget_inr}
                    onChange={e => setFormData({ ...formData, target_budget_inr: parseFloat(e.target.value) || 2000000 })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-7 pr-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400">PLOT DIMENSIONS (FEET)</label>
              <div className="mt-1.5 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-slate-500">Road Frontage Width (ft)</span>
                  <input 
                    type="number" 
                    value={formData.plot_width_ft}
                    onChange={e => setFormData({ ...formData, plot_width_ft: parseFloat(e.target.value) || 30 })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Plot Depth (ft)</span>
                  <input 
                    type="number" 
                    value={formData.plot_depth_ft}
                    onChange={e => setFormData({ ...formData, plot_depth_ft: parseFloat(e.target.value) || 40 })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="mt-2 font-mono text-xs text-amber-400">
                Gross Plot Area: {formData.plot_width_ft * formData.plot_depth_ft} sqft • Max Buildable (FSI 1.5): {(formData.plot_width_ft * formData.plot_depth_ft * 1.5).toFixed(0)} sqft
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400">FREEFORM LIFESTYLE BRIEF</label>
              <textarea
                rows={3}
                value={formData.user_prompt}
                onChange={e => setFormData({ ...formData, user_prompt: e.target.value })}
                placeholder="Describe your family, habits, or specific needs (e.g. Grandma has knee pain, need quiet WFH space)..."
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STAGE 2: Who Lives */}
        {currentStage === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <span>Stage 2: Who Lives in the Home?</span>
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Helps our engine size room dimensions, door clearances, and barrier-free access.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                <span className="text-xs font-mono text-slate-400">ADULTS</span>
                <input 
                  type="number" 
                  value={formData.adults}
                  onChange={e => setFormData({ ...formData, adults: parseInt(e.target.value) || 2 })}
                  className="mt-2 w-full text-center text-xl font-bold text-white bg-transparent focus:outline-none"
                />
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                <span className="text-xs font-mono text-slate-400">ELDERS</span>
                <input 
                  type="number" 
                  value={formData.elders}
                  onChange={e => setFormData({ ...formData, elders: parseInt(e.target.value) || 0 })}
                  className="mt-2 w-full text-center text-xl font-bold text-white bg-transparent focus:outline-none"
                />
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                <span className="text-xs font-mono text-slate-400">TODDLERS</span>
                <input 
                  type="number" 
                  value={formData.toddlers}
                  onChange={e => setFormData({ ...formData, toddlers: parseInt(e.target.value) || 0 })}
                  className="mt-2 w-full text-center text-xl font-bold text-white bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Accessibility & Pets Toggle */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 cursor-pointer hover:border-slate-700">
                <input 
                  type="checkbox"
                  checked={formData.elder_knee_pain}
                  onChange={e => handleElderToggle(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <div>
                  <p className="text-sm font-semibold text-white">Elder Mobility Assistance / Knee Pain</p>
                  <p className="text-xs text-slate-400">Forces ground-floor bedroom, 900mm wide wheelchair doors, and zero threshold steps.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 cursor-pointer hover:border-slate-700">
                <input 
                  type="checkbox"
                  checked={formData.has_pets}
                  onChange={e => setFormData({ ...formData, has_pets: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <div>
                  <p className="text-sm font-semibold text-white">Pet Living (Dog / Cat)</p>
                  <p className="text-xs text-slate-400">Allocates claw-proof epoxy or vitrified tiles; excludes slippery marble.</p>
                </div>
              </label>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Remote Work / WFH Hours</p>
                  <span className="font-mono text-xs text-blue-400">{formData.wfh_hours_per_day} hrs / day</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={12} 
                  value={formData.wfh_hours_per_day}
                  onChange={e => setFormData({ ...formData, wfh_hours_per_day: parseInt(e.target.value) })}
                  className="mt-3 w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: How You Live */}
        {currentStage === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-400" />
                <span>Stage 3: How You Live & Cultural Preferences</span>
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Controls room zoning, Vaastu orientations, and style palettes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400">VAASTU COMPLIANCE LEVEL</label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {[
                  { id: "vaastu_strict", label: "Strict Vaastu", desc: "Puja in East, Kitchen in SE, No shared toilet wall" },
                  { id: "vaastu_soft", label: "Soft Vaastu", desc: "Puja East, general positive orientation" },
                  { id: "vaastu_off", label: "Modern Layout", desc: "Zero Vaastu restrictions, max space efficiency" }
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, vaastu_faith: v.id })}
                    className={`rounded-xl border p-3 text-left transition ${formData.vaastu_faith === v.id ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <p className="text-xs font-bold">{v.label}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400">PREFERRED ARCHITECTURAL STYLES</label>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { id: "japanese", name: "Japanese Zen", desc: "Teak wood, screens, low seating" },
                  { id: "forest", name: "Biophilic Forest", desc: "Indoor greenery, laterite stone" },
                  { id: "brutalist", name: "Brutalist Concrete", desc: "Raw concrete, steel accents" },
                  { id: "minimalist", name: "Pure Minimalist", desc: "High LRV white, clean lines" },
                  { id: "old_is_gold", name: "Old is Gold", desc: "Heritage courtyard, terracotta" }
                ].map(s => {
                  const isSelected = formData.preferred_styles.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStyleToggle(s.id)}
                      className={`rounded-xl border p-3 text-left transition ${isSelected ? 'border-amber-400/80 bg-amber-400/10 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold">{s.name}</p>
                        {isSelected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{s.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 4: Site Physics */}
        {currentStage === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CloudSun className="h-5 w-5 text-blue-400" />
                <span>Stage 4: Site Physics & Environmental Baseline</span>
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Auto-pulled from Mumbai Geographical & Structural Code Pack.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                <span className="text-[11px] font-mono text-slate-500">SOIL TYPE</span>
                <p className="mt-1 text-sm font-bold text-white">Black Cotton</p>
                <p className="text-[10px] text-amber-400/90 font-mono mt-0.5">Raft Fdn Required</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                <span className="text-[11px] font-mono text-slate-500">BASIC WIND SPEED</span>
                <p className="mt-1 text-sm font-bold text-white">44 m/s</p>
                <p className="text-[10px] text-blue-400 font-mono mt-0.5">IS 875 Part 3</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                <span className="text-[11px] font-mono text-slate-500">SEISMIC ZONE</span>
                <p className="mt-1 text-sm font-bold text-white">Zone III</p>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">IS 1893 Factor Z=0.16</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                <span className="text-[11px] font-mono text-slate-500">ANNUAL RAIN</span>
                <p className="mt-1 text-sm font-bold text-white">2,200 mm</p>
                <p className="text-[10px] text-blue-400 font-mono mt-0.5">600mm Chajja Req.</p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <Check className="h-4 w-4" />
                <span>Site Physics Verified for MCGM Building Sanction</span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Our IS 456 Structural engine will size 230x230mm columns, span/16 beam depths, and a 4.5ft deep solid RCC raft foundation.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-800/80 pt-6">
          {currentStage > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStage(prev => prev - 1)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          {currentStage < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStage(prev => prev + 1)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-blue-500"
            >
              <span>Next Stage</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-amber-500 px-7 py-3 text-xs font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Constraints...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Taste Swipe</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
