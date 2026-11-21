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

export const submitQuestionnaire = (houseId: string, answers: object) =>
  call(`/api/v1/house/${houseId}/questionnaire`, { method: 'POST', body: JSON.stringify(answers) }, houseId);

export const getSwipeDecks = () => call('/api/v1/swipe/decks');

export const submitSwipe = (houseId: string, swipe: { card_id: string; deck: string; direction: string; dwell_ms: number }) =>
  call(`/api/v1/house/${houseId}/swipe`, { method: 'POST', body: JSON.stringify(swipe) }, houseId);

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
