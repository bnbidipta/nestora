const STYLES: Record<string, string> = {
  ready: 'border-emerald-800/50 bg-emerald-950/80 text-emerald-400',
  needs_review: 'border-red-800/50 bg-red-950/80 text-red-300',
};

export default function StatusBadge({ status }: { status: string }) {
  const label = status === 'needs_review' ? 'FAILED CHECKS' : status.replace(/_/g, ' ').toUpperCase();
  return (
    <span className={`rounded border px-2 py-0.5 font-mono text-xs ${STYLES[status] ?? 'border-slate-700 bg-slate-900 text-slate-300'}`}>
      {label}
    </span>
  );
}
