'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTwin } from '@/lib/useTwin';
import BOQTable from '@/components/BOQTable';
import TwinStatus from '@/components/ui/TwinStatus';
import Disclaimer from '@/components/ui/Disclaimer';

export default function Page() {
  const houseId = useParams().id as string;
  const { twin, error } = useTwin(houseId);
  if (!twin) return <TwinStatus error={error} />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/house/${houseId}`}
          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 font-mono text-xs text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to viewer
        </Link>
        <h1 className="font-mono text-xs text-slate-400">Cost estimate • House {houseId}</h1>
      </div>
      <Disclaimer className="mb-6" />
      <BOQTable twin={twin} />
    </div>
  );
}
