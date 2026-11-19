'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getHouse } from '@/lib/api';
import { HouseTwin } from '@/lib/twin';
import BOQTable from '@/components/BOQTable';

export default function BOQPage() {
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
        console.error('Error fetching twin', err);
      } finally {
        setLoading(false);
      }
    }
    if (houseId) fetchTwin();
  }, [houseId]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!twin) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/house/${houseId}`}
          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 font-mono text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Multi-Mode Viewer</span>
        </Link>
        <span className="font-mono text-xs text-slate-500">HOUSE ID: {houseId}</span>
      </div>

      <BOQTable twin={twin} />
    </div>
  );
}
