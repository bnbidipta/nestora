'use client';

/** Earlier versions of this design (kept on every change); restore any of them. */
import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { listVersions, restoreVersion } from '@/lib/api';

export default function Versions({ houseId, stamp, onRestored }: { houseId: string; stamp: string; onRestored: () => void }) {
  const [vs, setVs] = useState<{ n: number; note: string; at: number }[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  useEffect(() => { listVersions(houseId).then((r) => setVs(r.versions)).catch(() => {}); }, [houseId, stamp]);
  if (!vs.length) return null;
  return (
    <details className="rounded-2xl border border-slate-800 bg-[#131926] p-4 text-sm text-slate-200 print:hidden">
      <summary className="flex cursor-pointer items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider"><History className="h-4 w-4" aria-hidden />Earlier versions ({vs.length})</summary>
      <ul className="mt-3 space-y-2">
        {vs.map((v) => (
          <li key={v.n} className="flex items-center justify-between gap-3">
            <span>{v.note.replace(/\.$/, '')} <span className="text-xs text-slate-500">· {new Date(v.at * 1000).toLocaleString()}</span></span>
            <button type="button" disabled={busy !== null} onClick={async () => { setBusy(v.n); try { await restoreVersion(houseId, v.n); onRestored(); } finally { setBusy(null); } }}
              className="rounded-lg border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800 disabled:opacity-50">{busy === v.n ? 'Restoring…' : 'Restore'}</button>
          </li>
        ))}
      </ul>
    </details>
  );
}
