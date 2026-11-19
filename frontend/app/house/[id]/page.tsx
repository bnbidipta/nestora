'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getHouse } from '@/lib/api';
import { HouseTwin } from '@/lib/twin';
import Viewer from '@/components/Viewer';
import { Loader2, ArrowLeft, Download, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';

export default function HouseViewerPage() {
  const params = useParams();
  const houseId = params.id as string;
  const [twin, setTwin] = useState<HouseTwin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTwin() {
      try {
        const data = await getHouse(houseId);
        setTwin(data);
      } catch (err) {
        console.error('Error fetching house twin', err);
      } finally {
        setLoading(false);
      }
    }
    if (houseId) fetchTwin();
  }, [houseId]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="font-mono text-xs text-slate-400">Loading House Twin Single Source of Truth...</p>
        </div>
      </div>
    );
  }

  if (!twin) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">House '{houseId}' not found.</p>
        <Link href="/questionnaire" className="mt-4 inline-block text-blue-400 underline text-sm">
          Return to Questionnaire
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header & Actions Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/questionnaire"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-base font-bold text-white">
                HOUSE ID: {twin.house_id}
              </h1>
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 font-mono text-[10px] text-emerald-400 border border-emerald-800/50">
                STATUS: {twin.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              30x40 G+1 Pilot • Mumbai MCGM DCR 2034 • IS 456 Structural Concrete
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/house/${twin.house_id}/boq`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 font-mono text-xs text-slate-200 hover:bg-slate-700 transition"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
            <span>BOQ & Budget</span>
          </Link>

          <Link
            href={`/house/${twin.house_id}/review`}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 font-mono text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
            <span>Trust Sheet & Review</span>
          </Link>
        </div>
      </div>

      {/* Unified Viewer Component */}
      <Viewer twin={twin} />
    </div>
  );
}
