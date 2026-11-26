'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Send } from 'lucide-react';
import { requestReview } from '@/lib/api';
import { HouseTwin, JUDGE_CATEGORIES, getJudge } from '@/lib/twin';

export default function TrustSheet({ twin }: { twin: HouseTwin }) {
  const [requested, setRequested] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const judge = getJudge(twin);

  const handleRequest = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await requestReview(twin.house_id);
      if (res?.success) setRequested(true);
      else setError('Could not send the request. Please try again.');
    } catch {
      setError('Could not send the request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-line bg-card p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          {judge ? (
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 tabular-nums text-xs ${
                judge.pass
                  ? 'border-green/30 bg-green/10 text-green'
                  : 'border-red-500/30 bg-red-500/10 text-red-700'
              }`}
            >
              {judge.pass ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
              {judge.pass
                ? 'All automated checks passed'
                : `${judge.failures.length} automated check${judge.failures.length === 1 ? '' : 's'} failed`}
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-line px-3.5 py-1 tabular-nums text-xs text-muted">
              Not checked yet: generate the house first
            </span>
          )}
          <h2 className="mt-3 tabular-nums text-2xl text-ink sm:text-3xl">Automated checks</h2>
          <p className="mt-2 max-w-xl text-sm text-ink/80">
            A rules engine checks the design against a draft of Mumbai building rules and engineering thumb-rules.
            Passing these checks is not an approval. Only a licensed architect can approve a design.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-line bg-card/90 p-5 text-center sm:w-72">
          <p className="tabular-nums text-xs font-semibold uppercase tracking-wider text-gold-dark">Architect review</p>
          <p className="mt-2 text-sm text-ink/80">
            We&apos;re onboarding licensed architects for the Mumbai pilot. Request a review and we&apos;ll contact you when one
            is available. No payment is taken.
          </p>
          {requested ? (
            <p role="status" className="mt-3 rounded-lg border border-emerald-200/50 bg-emerald-50/60 p-2 text-xs text-green">
              Request received. We&apos;ll be in touch.
            </p>
          ) : (
            <button
              type="button"
              disabled={sending}
              onClick={handleRequest}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-terra px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-terra disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              Request a review
            </button>
          )}
          {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
        </div>
      </div>

      {judge && (
        <section className="rounded-2xl border border-line bg-card p-6">
          <h3 className="mb-6 tabular-nums text-sm font-semibold uppercase tracking-wider text-ink/80">Results by category</h3>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {JUDGE_CATEGORIES.map(({ prefix, title }) => {
              const fails = judge.failures.filter((f) => f.rule_id.startsWith(prefix));
              const warns = judge.warnings.filter((w) => w.rule_id.startsWith(prefix));
              return (
                <li key={prefix} className="rounded-2xl border border-line/80 bg-card/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-ink">{title}</h4>
                    <span className={`rounded border px-1.5 py-0.5 tabular-nums text-xs ${fails.length ? 'border-red-200/50 bg-red-50/60 text-red-700' : 'border-emerald-200/50 bg-emerald-50/60 text-green'}`}>
                      {fails.length ? 'FAIL' : 'PASS'}
                    </span>
                  </div>
                  {[...fails, ...warns].length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {fails.map((f, i) => (
                        <li key={`f${i}`} className="flex gap-2 text-xs text-red-700">
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span><span className="tabular-nums text-red-700">{f.rule_id}</span>: {f.message}</span>
                        </li>
                      ))}
                      {warns.map((w, i) => (
                        <li key={`w${i}`} className="flex gap-2 text-xs text-gold-dark">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span><span className="tabular-nums">{w.rule_id}</span>: {w.message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(twin as any).land?.checklist && (
        <section className="rounded-2xl border border-line bg-card p-6">
          <h2 className="tabular-nums text-sm uppercase tracking-wider text-ink">Plot risks and approvals</h2>
          {((twin as any).land.risks ?? []).length > 0 && (
            <ul className="mt-3 space-y-2">
              {(twin as any).land.risks.map((r: { level: string; title: string; detail: string }) => (
                <li key={r.title} className="rounded-lg bg-card/70 p-3 text-sm text-ink/80">
                  <span className={`mr-2 rounded px-1.5 py-0.5 tabular-nums text-[10px] uppercase ${r.level === 'high' ? 'bg-red-50 text-red-700' : r.level === 'medium' ? 'bg-amber-50 text-gold-dark' : 'bg-line text-ink'}`}>{r.level}</span>
                  <strong className="text-ink">{r.title}:</strong> {r.detail}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm font-semibold text-ink">Documents and approvals for Mumbai (MCGM)</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink/80">
            {(twin as any).land.checklist.map((c: string) => <li key={c}>{c}</li>)}
          </ol>
          <p className="mt-3 text-xs text-muted">{(twin as any).land.not_covered} Checklist is a research draft, not yet verified.</p>
        </section>
      )}
    </div>
  );
}
