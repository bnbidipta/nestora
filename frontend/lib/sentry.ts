/** Crash reports to Sentry's free plan; does nothing until NEXT_PUBLIC_SENTRY_DSN is set. No personal data is sent. */
import * as Sentry from '@sentry/browser';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
let ready = false;

export function initSentry() {
  if (!dsn || ready || typeof window === 'undefined') return;
  ready = true;
  Sentry.init({
    dsn, sendDefaultPii: false, tracesSampleRate: 0,
    beforeSend(event) {  // no query strings/fragments (login codes, tokens) and no emails anywhere
      const clean = (s?: string) => s?.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').replace(/([?#])[^\s"']*/g, '$1[removed]');
      if (event.request) { event.request.url = clean(event.request.url); delete event.request.query_string; delete event.request.cookies; }
      event.exception?.values?.forEach((v) => { v.value = clean(v.value); });
      event.message = clean(event.message);
      event.breadcrumbs = event.breadcrumbs?.map((b) => ({ ...b, message: clean(b.message), data: b.data && { ...b.data, url: clean(b.data.url as string | undefined), from: clean(b.data.from as string | undefined), to: clean(b.data.to as string | undefined) } }));
      return event;
    },
  });
}

export function reportError(e: unknown) {
  initSentry();
  if (ready) Sentry.captureException(e);
}
