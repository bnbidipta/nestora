import { HouseTwin } from './twin';
export type { HouseTwin };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function createHouse(data: any = {}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/house`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to create house');
  return json.house_id;
}

export async function getHouse(houseId: string): Promise<HouseTwin> {
  const res = await fetch(`${API_BASE}/api/v1/house/${houseId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch house');
  return json.data;
}

export async function submitQuestionnaire(houseId: string, answers: any) {
  const res = await fetch(`${API_BASE}/api/v1/house/${houseId}/questionnaire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  });
  return res.json();
}

export async function getSwipeDecks() {
  const res = await fetch(`${API_BASE}/api/v1/swipe/decks`);
  return res.json();
}

export async function submitSwipe(houseId: string, swipeData: { card_id: string; deck: string; direction: string; dwell_ms: number }) {
  const res = await fetch(`${API_BASE}/api/v1/house/${houseId}/swipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(swipeData),
  });
  return res.json();
}

export async function generateHouse(houseId: string) {
  const res = await fetch(`${API_BASE}/api/v1/house/${houseId}/generate`, {
    method: 'POST',
  });
  return res.json();
}

export async function getModeRender(houseId: string, mode: string) {
  const res = await fetch(`${API_BASE}/api/v1/house/${houseId}/modes/${mode}`);
  return res.json();
}

export async function requestReview(houseId: string) {
  const res = await fetch(`${API_BASE}/api/v1/house/${houseId}/review`, {
    method: 'POST',
  });
  return res.json();
}
