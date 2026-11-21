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
      <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-slate-800 bg-[#131926] p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          {judge ? (
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-mono text-xs ${
                judge.pass
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              {judge.pass ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
              {judge.pass
                ? 'All automated checks passed'
                : `${judge.failures.length} automated check${judge.failures.length === 1 ? '' : 's'} failed`}
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-slate-700 px-3.5 py-1 font-mono text-xs text-slate-400">
              Not checked yet: generate the house first
            </span>
          )}
          <h2 className="mt-3 font-mono text-2xl font-bold text-white sm:text-3xl">Automated checks</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            A rules engine checks the design against a draft of Mumbai building rules and engineering thumb-rules.
            Passing these checks is not an approval. Only a licensed architect can approve a design.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 p-5 text-center sm:w-72">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">Architect review</p>
          <p className="mt-2 text-sm text-slate-300">
            We&apos;re onboarding licensed architects for the Mumbai pilot. Request a review and we&apos;ll contact you when one
            is available. No payment is taken.
          </p>
          {requested ? (
            <p role="status" className="mt-3 rounded-lg border border-emerald-700/50 bg-emerald-950/60 p-2 text-xs text-emerald-300">
              Request received. We&apos;ll be in touch.
            </p>
          ) : (
            <button
              type="button"
              disabled={sending}
              onClick={handleRequest}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              Request a review
            </button>
          )}
          {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      </div>

      {judge && (
        <section className="rounded-2xl border border-slate-800 bg-[#131926] p-6">
          <h3 className="mb-6 font-mono text-sm font-bold uppercase tracking-wider text-slate-300">Results by category</h3>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {JUDGE_CATEGORIES.map(({ prefix, title }) => {
              const fails = judge.failures.filter((f) => f.rule_id.startsWith(prefix));
              const warns = judge.warnings.filter((w) => w.rule_id.startsWith(prefix));
              return (
                <li key={prefix} className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-white">{title}</h4>
                    <span className={`rounded border px-1.5 py-0.5 font-mono text-xs ${fails.length ? 'border-red-800/50 bg-red-950/60 text-red-300' : 'border-emerald-800/50 bg-emerald-950/60 text-emerald-400'}`}>
                      {fails.length ? 'FAIL' : 'PASS'}
                    </span>
                  </div>
                  {[...fails, ...warns].length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {fails.map((f, i) => (
                        <li key={`f${i}`} className="flex gap-2 text-xs text-red-300">
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span><span className="font-mono text-red-400">{f.rule_id}</span>: {f.message}</span>
                        </li>
                      ))}
                      {warns.map((w, i) => (
                        <li key={`w${i}`} className="flex gap-2 text-xs text-amber-300">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span><span className="font-mono">{w.rule_id}</span>: {w.message}</span>
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
    </div>
  );
}
