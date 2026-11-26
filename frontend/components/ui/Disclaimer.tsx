export default function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p role="note" className={`rounded-lg border border-amber-200/40 bg-amber-50/30 px-3 py-2 text-xs text-gold-dark ${className}`}>
      <strong>Concept design and estimate, not for construction.</strong> Building rules and rates are
      unverified drafts. A licensed architect and structural engineer must review and stamp any plan
      before you build.
    </p>
  );
}
