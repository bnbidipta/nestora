'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';

/** Loading / error placeholder shared by the house pages. */
export default function TwinStatus({ error }: { error: string | null }) {
  if (!error) {
    return (
      <div role="status" className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-muted">
        <Loader2 className="h-6 w-6 animate-spin text-terra" aria-hidden />
        Loading house…
      </div>
    );
  }
  return (
    <div role="alert" className="mx-auto max-w-md py-16 text-center">
      <p className="text-red-700">{error}</p>
      <button type="button" onClick={() => location.reload()} className="mt-4 block w-full rounded-full bg-terra px-5 py-2 text-sm font-semibold text-white hover:bg-terra-dark">Try again</button>
      <Link href="/questionnaire" className="mt-4 inline-block text-sm text-terra underline">
        Start a new design
      </Link>
    </div>
  );
}
