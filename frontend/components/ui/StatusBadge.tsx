const STYLES: Record<string, string> = {
  ready: 'border-emerald-200/50 bg-emerald-50/80 text-green',
  needs_review: 'border-red-200/50 bg-red-50/80 text-red-700',
};

export default function StatusBadge({ status }: { status: string }) {
  const label = status === 'needs_review' ? 'FAILED CHECKS' : status.replace(/_/g, ' ').toUpperCase();
  return (
    <span className={`rounded border px-2 py-0.5 tabular-nums text-xs ${STYLES[status] ?? 'border-line bg-card text-ink/80'}`}>
      {label}
    </span>
  );
}
