/**
 * Pilot funnel analytics (PostHog capture API, no SDK). Sends nothing unless the visitor accepted the
 * consent banner AND NEXT_PUBLIC_POSTHOG_KEY is set. No PII: a random id, the event name and coarse props.
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
const CONSENT = 'nestora_consent';
const ID = 'nestora_anon_id';

export type Consent = 'granted' | 'denied' | null;

export function getConsent(): Consent {
  try {
    return (localStorage.getItem(CONSENT) as Consent) ?? null;
  } catch {
    return null;
  }
}

export function setConsent(c: 'granted' | 'denied'): void {
  try {
    localStorage.setItem(CONSENT, c);
    if (c === 'denied') localStorage.removeItem(ID);
  } catch {
    /* private mode */
  }
}

function anonId(): string {
  let id = localStorage.getItem(ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ID, id);
  }
  return id;
}

export function track(event: string, props: Record<string, string | number | boolean> = {}): void {
  if (!KEY || typeof window === 'undefined' || getConsent() !== 'granted') return;
  try {
    const body = JSON.stringify({ api_key: KEY, event, distinct_id: anonId(), properties: { ...props, $current_url: location.pathname } });
    navigator.sendBeacon?.(`${HOST}/capture/`, body) || fetch(`${HOST}/capture/`, { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {
    /* analytics must never break the app */
  }
}
