'use client';

/** The photoreal picture of the chosen design (rendered in batches on a free GPU), or a note that it's on the way. */
import { Camera } from 'lucide-react';

export interface RenderInfo { status: 'queued' | 'done'; key: string; photo?: string; ai?: boolean }

export default function PhotoRender({ render }: { render?: RenderInfo }) {
  if (!render) return null;
  if (render.status !== 'done' || !render.photo) {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#131926] p-4 text-sm text-slate-300 print:hidden">
        <Camera className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />
        Photoreal render on the way. We render new designs in batches, so it may take a few hours; it will appear here.
      </section>
    );
  }
  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-800 bg-[#131926]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={render.photo} alt="Photoreal picture of this design" className="w-full" loading="lazy" />
      <figcaption className="px-4 py-2 text-xs text-slate-400">
        {render.ai ? 'AI-assisted photoreal render of this exact design; ' : 'Rendered picture of this exact design; '}
        plants, sky and surroundings are illustrative.
      </figcaption>
    </figure>
  );
}
