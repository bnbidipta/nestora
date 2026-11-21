import Link from 'next/link';
import { Loader2 } from 'lucide-react';

/** Loading / error placeholder shared by the house pages. */
export default function TwinStatus({ error }: { error: string | null }) {
  if (!error) {
    return (
      <div role="status" className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" aria-hidden />
        Loading house…
      </div>
    );
  }
  return (
    <div role="alert" className="mx-auto max-w-md py-16 text-center">
      <p className="text-red-400">{error}</p>
      <Link href="/questionnaire" className="mt-4 inline-block text-sm text-blue-400 underline">
        Start a new design
      </Link>
    </div>
  );
}
