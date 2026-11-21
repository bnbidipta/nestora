export default function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p role="note" className={`rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-200 ${className}`}>
      <strong>Concept design and estimate, not for construction.</strong> Building rules and rates are
      unverified drafts. A licensed architect and structural engineer must review and stamp any plan
      before you build.
    </p>
  );
}
