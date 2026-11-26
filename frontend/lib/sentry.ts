/** Crash reports to Sentry's free plan; does nothing until NEXT_PUBLIC_SENTRY_DSN is set. No personal data is sent. */
import * as Sentry from '@sentry/browser';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
let ready = false;

export function initSentry() {
  if (!dsn || ready || typeof window === 'undefined') return;
  ready = true;
  Sentry.init({
    dsn, sendDefaultPii: false, tracesSampleRate: 0,
    beforeSend(event) {  // strip edit tokens and emails from URLs/breadcrumbs
      const clean = (s?: string) => s?.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').replace(/(token=)[^&]+/g, '$1[removed]');
      if (event.request?.url) event.request.url = clean(event.request.url);
      event.breadcrumbs?.forEach((b) => { b.message = clean(b.message); if (b.data?.url) b.data.url = clean(String(b.data.url)); });
      return event;
    },
  });
}

export function reportError(e: unknown) {
  initSentry();
  if (ready) Sentry.captureException(e);
}
