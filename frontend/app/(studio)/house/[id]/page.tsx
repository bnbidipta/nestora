'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useTwin } from '@/lib/useTwin';
import Viewer from '@/components/Viewer';
import TwinStatus from '@/components/ui/TwinStatus';
import StatusBadge from '@/components/ui/StatusBadge';
import Disclaimer from '@/components/ui/Disclaimer';
import SaveHouseButton from '@/components/ui/SaveHouseButton';

export default function HouseViewerPage() {
  const houseId = useParams().id as string;
  const { twin, error } = useTwin(houseId);
  if (!twin) return <TwinStatus error={error} />;
  if (!twin.floors.length) {
    return (
      <div className="py-16 text-center text-slate-300">
        <p>This house doesn&apos;t have a chosen design yet.</p>
        <Link href={`/house/${twin.house_id}/options`} className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900">See layout options</Link>
      </div>
    );
  }

  const { plot_width_ft, plot_depth_ft } = twin.plot;
  const floors = twin.floors.length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/questionnaire"
            aria-label="Back to questionnaire"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-base font-bold text-white">House {twin.house_id}</h1>
              <StatusBadge status={twin.status} />
            </div>
            <p className="font-mono text-xs text-slate-400">
              {plot_width_ft}×{plot_depth_ft} ft plot • {floors === 1 ? 'G' : `G+${floors - 1}`} • {String(twin.metadata?.city ?? 'mumbai').replace(/^./, (c) => c.toUpperCase())}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <SaveHouseButton houseId={twin.house_id} />
          <Link
            href={`/house/${twin.house_id}/boq`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 font-mono text-xs text-slate-200 transition hover:bg-slate-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" aria-hidden />
            Cost estimate
          </Link>
          <Link
            href={`/house/${twin.house_id}/review`}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 font-mono text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            Checks & review
          </Link>
        </div>
      </div>
      <Disclaimer className="mb-6" />
      <Viewer twin={twin} />
    </div>
  );
}
