import { HouseTwin } from './twin';
import { supabase } from './supabase';
export type { HouseTwin };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Anonymous creators get an edit token per house; the browser keeps it until the house is claimed.
const tokenKey = (houseId: string) => `nestora_edit_token_${houseId}`;

function readToken(houseId: string): string | null {
  try {
    return localStorage.getItem(tokenKey(houseId));
  } catch {
    return null;
  }
}

async function authHeaders(houseId?: string): Promise<Record<string, string>> {
  const h: Record<string, string> = {};
  const { data } = await supabase.auth.getSession();
  if (data.session) h.Authorization = `Bearer ${data.session.access_token}`;
  const token = houseId ? readToken(houseId) : null;
  if (token) h['X-Edit-Token'] = token;
  return h;
}

/** fetch + JSON with a readable error for non-2xx responses. */
async function call<T = any>(path: string, init: RequestInit = {}, houseId?: string): Promise<T> {
  const headers = { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(await authHeaders(houseId)), ...init.headers };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.detail || json?.error?.message || `Request failed (${res.status})`;
    throw new Error(typeof msg === 'string' ? msg : 'Request failed');
  }
  return json as T;
}

/** Wakes the backend early; the free host sleeps after 15 idle minutes. */
export function warmUpApi(): void {
  fetch(`${API_BASE}/health`).catch(() => {});
}

export async function createHouse(data: object = {}): Promise<string> {
  const json = await call<{ success: boolean; house_id: string; edit_token?: string }>('/api/v1/house', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (json.edit_token) {
    try {
      localStorage.setItem(tokenKey(json.house_id), json.edit_token);
    } catch {
      /* private mode: the house stays readable but can't be edited later */
    }
  }
  return json.house_id;
}

export async function getHouse(houseId: string): Promise<HouseTwin> {
  const json = await call<{ success: boolean; data: HouseTwin }>(`/api/v1/house/${houseId}`);
  return json.data;
}

export type Strictness = 'off' | 'soft' | 'strict';

/** Mirrors backend/app/models/brief.py. */
export interface Brief {
  build_type: 'new_plot' | 'renovation' | 'flat_interior';
  city: string;
  plot_width_ft: number;
  plot_depth_ft: number;
  road_width_m: number;
  facing: 'N' | 'E' | 'S' | 'W';
  corner_plot: boolean;
  soil: 'black_cotton' | 'red_soil' | 'hard_rock' | 'coastal';
  floors_wanted: number;
  parking: 'none' | 'two_wheeler' | 'car';
  cars: number;
  two_wheelers: number;
  flood_prone: boolean;
  future_extra_floor: boolean;
  lift: 'none' | 'shaft' | 'lift';
  low_maintenance: boolean;
  budget_inr: number;
  tier: 'economy' | 'standard' | 'premium';
  adults: number;
  elders: number;
  elder_mobility_issue: boolean;
  couples?: number;
  singles?: number;
  elder_couples?: number;
  elder_singles?: number;
  bedrooms?: number | null;
  kids: number;
  pets: boolean;
  wfh_people: number;
  joint_family: boolean;
  rental_floor: boolean;
  puja: 'none' | 'nook' | 'room';
  kitchen: 'closed' | 'open';
  dining_seats?: number;
  guest_room: boolean;
  help_room: boolean;
  laundry: boolean;
  store_room: boolean;
  master_dressing: boolean;
  terrace_garden: boolean;
  traditions: Record<string, Strictness>;
  styles: string[];
  styles_locked: boolean;
  free_text: string;
}

export interface StyleEntry {
  photo?: string | null;
  photo_credit?: string | null;
  id: string;
  name: string;
  group: string;
  climate: string[];
  features: string[];
  palette: Record<'wall' | 'accent' | 'wood' | 'floor', string>;
  cost: string;
  mumbai: string;
}

export interface Option {
  id: string;
  pass: boolean;
  judge: { pass: boolean; failures: { rule_id: string; message: string }[]; warnings: { rule_id: string; message: string }[] };
  traditions: Record<string, { mode: Strictness; score: number }>;
  score: { total: number; brief_fit: Record<string, number>; features: Record<string, number> };
  summary: {
    floors: number; parking: string; stilt: boolean; arrangement: string; built_up_sqft: number; fsi_used: number;
    bedrooms: number; cost_inr: { low: number; expected: number; high: number }; dropped: string[]; envelope_ft: [number, number];
  };
  preview: { f: number; id: string; t: string; x: number; y: number; w: number; d: number }[];
  look?: import('./house3d').Look;
  tradition_relaxed?: boolean;
}

export interface OptionsResponse {
  success: boolean; status: string; round?: number; options: Option[]; reason?: string; exhausted?: boolean;
}

export const saveBrief = (houseId: string, brief: Brief) =>
  call<{ success: boolean; understood: string[]; waitlist: string | null }>(
    `/api/v1/house/${houseId}/brief`, { method: 'POST', body: JSON.stringify(brief) }, houseId);

export const extractBrief = (text: string) =>
  call<{ fields: Partial<Brief>; evidence: Record<string, string>; questions: string[]; source: string }>(
    '/api/v1/brief/extract', { method: 'POST', body: JSON.stringify({ text }) });

export const getStyles = () => call<{ groups: string[]; styles: StyleEntry[] }>('/api/v1/styles');

export const getTraditions = () =>
  call<{ traditions: { id: string; name: string; description: string; verified: boolean }[] }>('/api/v1/traditions');

export const joinWaitlist = (kind: 'city' | 'flat_interior' | 'renovation', email: string, city?: string) =>
  call('/api/v1/waitlist', { method: 'POST', body: JSON.stringify({ kind, email, city }) });

export interface SwipeCard {
  id: string; file: string; deck: string; style: string; style_name: string; alt: string; author: string; url: string; licence: string; ai?: boolean;
}

export const getSwipeCards = (styles: string[] = []) =>
  call<{ cards: SwipeCard[]; min_swipes: number; max_swipes: number }>(`/api/v1/swipe/cards${styles.length ? `?styles=${encodeURIComponent(styles.join(','))}` : ''}`);

export const submitSwipe = (houseId: string, swipe: { card_id: string; direction: 'left' | 'right'; dwell_ms: number }) =>
  call<{ done: boolean; swipes: number; recommended_styles: string[]; style_scores: Record<string, number>; confidence: number }>(
    `/api/v1/house/${houseId}/swipe`, { method: 'POST', body: JSON.stringify(swipe) }, houseId);

export const startOptions = (houseId: string) =>
  call<OptionsResponse>(`/api/v1/house/${houseId}/options`, { method: 'POST' }, houseId);

export const selectOptions = (houseId: string, keep: string[], discard: string[]) =>
  call<OptionsResponse>(`/api/v1/house/${houseId}/options/select`, { method: 'POST', body: JSON.stringify({ keep, discard }) }, houseId);

export const chooseOption = (houseId: string, id: string) =>
  call<{ success: boolean; status: string }>(`/api/v1/house/${houseId}/options/choose`, { method: 'POST', body: JSON.stringify({ id }) }, houseId);

export const editHouse = (houseId: string, action: 'grow' | 'shrink' | 'mirror', room?: string) =>
  call<{ success: boolean; status: string }>(`/api/v1/house/${houseId}/edit`, { method: 'POST', body: JSON.stringify({ action, room }) }, houseId);

export interface WhatIf {
  change: string; note: string; preview: Option['preview']; envelope_ft: [number, number]; dropped: string[];
  cost_inr: { low: number; expected: number; high: number }; cost_before_inr: { low: number; expected: number; high: number };
  built_up_sqft: number; built_up_before_sqft: number;
}
export const whatIf = (houseId: string, change: 'study' | 'guest' | 'floor' | 'kitchen', apply = false) =>
  call<WhatIf & { success?: boolean; status?: string }>(`/api/v1/house/${houseId}/whatif`, { method: 'POST', body: JSON.stringify({ change, apply }) }, houseId);

export const makeVoteLink = (houseId: string) =>
  call<{ token: string }>(`/api/v1/house/${houseId}/vote-link`, { method: 'POST' }, houseId);
export const readVote = (houseId: string, t: string) =>
  call<{ options: Option[]; tally: Record<string, string[]> }>(`/api/v1/house/${houseId}/vote?t=${encodeURIComponent(t)}`);
export const castVote = (houseId: string, body: { token: string; voter: string; name: string; likes: string[] }) =>
  call<{ tally: Record<string, string[]> }>(`/api/v1/house/${houseId}/vote`, { method: 'POST', body: JSON.stringify(body) });
export const ownerVotes = (houseId: string) =>
  call<{ tally: Record<string, string[]>; people: number }>(`/api/v1/house/${houseId}/votes`, {}, houseId);
export const listVersions = (houseId: string) =>
  call<{ versions: { n: number; note: string; at: number }[] }>(`/api/v1/house/${houseId}/versions`);
export const restoreVersion = (houseId: string, n: number) =>
  call<{ status: string }>(`/api/v1/house/${houseId}/versions/${n}/restore`, { method: 'POST' }, houseId);

export const dxfUrl = (houseId: string) => `${API_BASE}/api/v1/house/${houseId}/export/dxf`;

export const generateHouse = (houseId: string) =>
  call(`/api/v1/house/${houseId}/generate`, { method: 'POST' }, houseId);

export const requestReview = (houseId: string) =>
  call(`/api/v1/house/${houseId}/review`, { method: 'POST' }, houseId);

/** Attaches an anonymous house to the signed-in account. */
export async function claimHouse(houseId: string): Promise<void> {
  await call(`/api/v1/house/${houseId}/claim`, { method: 'POST' }, houseId);
  try {
    localStorage.removeItem(tokenKey(houseId));
  } catch {
    /* ignore */
  }
}

/** True if this browser created the house or the user may own it (used to show edit actions). */
export const canEditLocally = (houseId: string) => readToken(houseId) !== null;
