'use client';

/**
 * Units. The backend speaks feet; this file converts for display and input.
 * - Length system: ft or m, one global switch (header), remembered in localStorage.
 * - Area units for plots: the regional units people actually quote. Some (katha, bigha, biswa) differ by state,
 *   so each has a per-state default and the user can override the value.
 * Sources: docs/research/plot-units (sobha.com, housing.com, Wikipedia "Bigha"/"Katha"/"Marla").
 */
import { useSyncExternalStore } from 'react';

export type LengthUnit = 'ft' | 'm';
const FT_PER_M = 3.28084;
const KEY = 'nestora_units';
const EVT = 'nestora-units';

function cookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  return document.cookie.match(new RegExp(`(?:^|; )${name}=([A-Z0-9]{1,3})`))?.[1] ?? null;
}
export const country = () => cookie('nestora_country');
export const region = () => cookie('nestora_region');

function read(): LengthUnit {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'ft' || v === 'm') return v;
  } catch { /* private mode */ }
  const c = country();
  return !c || ['IN', 'US', 'GB'].includes(c) ? 'ft' : 'm';
}

export function setLengthUnit(u: LengthUnit) {
  try { localStorage.setItem(KEY, u); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
}

export function useLengthUnit(): LengthUnit {
  return useSyncExternalStore(
    (cb) => { window.addEventListener(EVT, cb); window.addEventListener('storage', cb); return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb); }; },
    read,
    () => 'ft',
  );
}

const trim = (n: number, d = 1) => Number(n.toFixed(d)).toLocaleString('en-IN');
/** feet -> number in the chosen unit */
export const fromFt = (ft: number, u: LengthUnit) => (u === 'ft' ? ft : ft / FT_PER_M);
export const toFt = (v: number, u: LengthUnit) => (u === 'ft' ? v : v * FT_PER_M);
export const len = (ft: number, u: LengthUnit, d = 1) => `${trim(fromFt(ft, u), d)} ${u}`;
/** compact form for drawings: 12.5′ or 3.8 m */
export const lenShort = (ft: number, u: LengthUnit) => (u === 'ft' ? `${trim(ft)}′` : `${trim(ft / FT_PER_M)}m`);
export const area = (sqft: number, u: LengthUnit) =>
  u === 'ft' ? `${Math.round(sqft).toLocaleString('en-IN')} sq ft` : `${trim(sqft / (FT_PER_M * FT_PER_M))} m²`;
export const perArea = (u: LengthUnit) => (u === 'ft' ? 'sq ft' : 'm²');
/** a rate quoted per sq ft, shown per the chosen unit */
export const perAreaRate = (perSqft: number, u: LengthUnit) => (u === 'ft' ? perSqft : perSqft * FT_PER_M * FT_PER_M);

// ---- regional plot-area units ----
export type AreaUnit = { id: string; name: string; sqft: number; varies?: boolean };
const BASE: AreaUnit[] = [
  { id: 'sqft', name: 'sq ft', sqft: 1 },
  { id: 'sqm', name: 'sq m', sqft: FT_PER_M * FT_PER_M },
  { id: 'sqyd', name: 'sq yard / gaj', sqft: 9 },
  { id: 'guntha', name: 'guntha', sqft: 1089 },
  { id: 'cent', name: 'cent', sqft: 435.6 },
  { id: 'decimal', name: 'decimal', sqft: 435.6 },
  { id: 'ground', name: 'ground', sqft: 2400 },
  { id: 'ankanam', name: 'ankanam', sqft: 72 },
  { id: 'kuncham', name: 'kuncham', sqft: 4356 },
  { id: 'marla', name: 'marla', sqft: 272.25, varies: true },
  { id: 'kanal', name: 'kanal', sqft: 5445, varies: true },
  { id: 'katha', name: 'katha', sqft: 720, varies: true },
  { id: 'bigha', name: 'bigha', sqft: 14400, varies: true },
  { id: 'biswa', name: 'biswa', sqft: 1361.25, varies: true },
  { id: 'acre', name: 'acre', sqft: 43560 },
];

/** Per-state values for units that vary (ISO 3166-2:IN region codes). */
const STATE_VALUE: Record<string, Partial<Record<string, number>>> = {
  WB: { katha: 720, bigha: 14400 },
  AS: { katha: 2880, bigha: 14400 },
  BR: { katha: 1361.25, bigha: 27225, biswa: 1361.25 },
  JH: { katha: 1742 },
  MP: { katha: 600, bigha: 12000 },
  UP: { bigha: 27225, biswa: 1361.25 },
  RJ: { bigha: 27225, biswa: 1361.25 },
  HR: { bigha: 27225, biswa: 1361.25 },
  HP: { bigha: 8712 },
  UK: { bigha: 6806.25 }, UT: { bigha: 6806.25 },
  GJ: { bigha: 17424 },
};

/** Usual plot-area unit per state. */
const STATE_UNIT: Record<string, string> = {
  WB: 'katha', BR: 'katha', JH: 'katha', AS: 'bigha', TR: 'katha',
  DL: 'sqyd', UP: 'sqyd', HR: 'sqyd', RJ: 'sqyd', TG: 'sqyd', TS: 'sqyd', AP: 'sqyd',
  PB: 'marla', HP: 'marla', JK: 'marla', CH: 'marla',
  TN: 'ground', KL: 'cent', OR: 'decimal', OD: 'decimal',
};

export function areaUnits(state = region()): AreaUnit[] {
  const v = (state && STATE_VALUE[state]) || {};
  return BASE.map((u) => (v[u.id] ? { ...u, sqft: v[u.id]! } : u));
}

export function defaultAreaUnit(state = region()): string {
  if (state && STATE_UNIT[state]) return STATE_UNIT[state];
  return country() && country() !== 'IN' && !['US', 'GB'].includes(country()!) ? 'sqm' : 'sqft';
}

/** "1,200 sq ft · 1.67 katha" when the regional unit differs from the display unit. */
export function plotArea(sqft: number, u: LengthUnit, regional?: AreaUnit | null): string {
  const main = area(sqft, u);
  if (!regional || regional.id === 'sqft' || regional.id === 'sqm') return main;
  return `${main} · ${trim(sqft / regional.sqft, 2)} ${regional.name}`;
}

const RKEY = 'nestora_area_unit';
/** The user's regional unit (id + value), remembered so other pages can echo the plot area in it. */
export function saveRegional(u: AreaUnit) {
  try { localStorage.setItem(RKEY, JSON.stringify(u)); } catch { /* ignore */ }
}
export function loadRegional(): AreaUnit | null {
  try { return JSON.parse(localStorage.getItem(RKEY) ?? 'null'); } catch { return null; }
}
