'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useTwin } from '@/lib/useTwin';
import Viewer from '@/components/Viewer';
import TwinStatus from '@/components/ui/TwinStatus';
import StatusBadge from '@/components/ui/StatusBadge';
import Disclaimer from '@/components/ui/Disclaimer';
import { lenShort, useLengthUnit } from '@/lib/units';
import SaveHouseButton from '@/components/ui/SaveHouseButton';

export default function HouseViewerPage() {
  const houseId = useParams().id as string;
  const { twin, error } = useTwin(houseId);
  const u = useLengthUnit();
  if (!twin) return <TwinStatus error={error} />;
  if (!twin.floors.length) {
    return (
      <div className="py-16 text-center text-ink/80">
        <p>This house doesn&apos;t have a chosen design yet.</p>
        <Link href={`/house/${twin.house_id}/options`} className="mt-4 inline-block rounded-lg bg-card px-4 py-2 text-sm font-semibold text-ink">See options</Link>
      </div>
    );
  }

  const { plot_width_ft, plot_depth_ft } = twin.plot;
  const floors = twin.floors.length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/questionnaire"
            aria-label="Back to questionnaire"
            className="flex h-8 w-8 items-center justify-center rounded-2xl border border-line bg-card text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="tabular-nums text-base font-bold text-ink">House {twin.house_id}</h1>
              <StatusBadge status={twin.status} />
            </div>
            <p className="tabular-nums text-xs text-muted">
              {lenShort(plot_width_ft, u)}×{lenShort(plot_depth_ft, u)} plot • {floors === 1 ? 'G' : `G+${floors - 1}`} • {String(twin.metadata?.city ?? 'mumbai').replace(/^./, (c) => c.toUpperCase())}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <SaveHouseButton houseId={twin.house_id} />
          <Link
            href={`/house/${twin.house_id}/boq`}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-paper2/60 px-3 py-1.5 tabular-nums text-xs text-ink transition hover:bg-line"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-terra" aria-hidden />
            Cost estimate
          </Link>
          <Link
            href={`/house/${twin.house_id}/review`}
            className="flex items-center gap-1.5 rounded-full bg-terra px-3.5 py-1.5 tabular-nums text-xs font-semibold text-white shadow-sm transition hover:bg-terra"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
            Checks & review
          </Link>
        </div>
      </div>
      <Disclaimer className="mb-6" />
      <Viewer twin={twin} />
    </div>
  );
}
