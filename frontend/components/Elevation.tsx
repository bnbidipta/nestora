'use client';

/**
 * Front elevation (seen from the road) drawn from the same geometry as the 3D house: walls, windows, shading,
 * balconies, terrace, pergola and roofs projected onto one plane, farthest first so nearer elements cover them.
 */
import { useMemo } from 'react';
import { HouseTwin } from '@/lib/twin';
import { Look, buildHouse } from '@/lib/house3d';
import { lenShort, useLengthUnit } from '@/lib/units';

const FILL: Record<string, string> = {
  slab: '#CFC9BE', parapet: '', wall: '', mumty: '', glass: '#9FB7C6', chhajja: '#BEB7AA', jaali: '', plinth: '#8B8478',
  band: '', pergola: '', tank: '#2A2A2A', garden: '#5C8A46', rail: '#55585c', roof: '', gable: '',
};

export default function Elevation({ twin }: { twin: HouseTwin }) {
  const u = useLengthUnit();
  const look = ((twin.metadata ?? {}) as Record<string, unknown>).look as Look | undefined;
  const house = useMemo(() => buildHouse(
    twin.floors.map((f) => ({ floor_no: f.floor_no, floor_height_ft: f.floor_height_ft, rooms: f.rooms as never })),
    () => undefined, { look },
  ), [twin, look]);
  const colour = (k: string) => FILL[k] || (k === 'roof' ? look?.roof.tile ?? '#A0522D'
    : ['band'].includes(k) ? look?.facade.accent ?? '#B5651D' : ['jaali', 'pergola'].includes(k) ? look?.facade.wood ?? '#7A4E2D'
      : look?.facade.wall ?? '#F1EDE4');

  // shapes in (x, z), each with the depth of its nearest point; draw far to near
  const shapes = [
    ...house.boxes.filter((b) => b.kind !== 'lining' && b.kind !== 'step').map((b) => ({
      depth: b.y0, k: b.kind, pts: [[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1]] })),
    ...house.tris.flatMap((t) => Array.from({ length: t.p.length / 9 }, (_, i) => {
      const p = t.p.slice(i * 9, i * 9 + 9);
      return { depth: Math.min(p[1], p[4], p[7]), k: t.kind as string, pts: [[p[0], p[2]], [p[3], p[5]], [p[6], p[8]]] };
    })),
  ].sort((a, b) => b.depth - a.depth);
  const xs = shapes.flatMap((s) => s.pts.map((p) => p[0])), zs = shapes.flatMap((s) => s.pts.map((p) => p[1]));
  const x0 = Math.min(...xs) - 4, x1 = Math.max(...xs) + 4, z0 = -1.5, z1 = Math.max(...zs) + 3;
  const height = Math.max(...zs) + 0.5;

  return (
    <figure className="rounded-xl bg-white p-3">
      <svg viewBox={`${x0} ${-z1} ${x1 - x0} ${z1 - z0}`} className="mx-auto max-h-[560px] w-full" role="img" aria-label="Front elevation of the house">
        <rect x={x0} y={-z1} width={x1 - x0} height={z1 - z0} fill="#F7F3EC" />
        {shapes.map((s, i) => (
          <polygon key={i} points={s.pts.map(([x, z]) => `${x},${-z}`).join(' ')} fill={colour(s.k)}
            stroke="#2b2622" strokeWidth={0.08} strokeLinejoin="round" opacity={s.k === 'glass' ? 0.9 : 1} />
        ))}
        <line x1={x0} x2={x1} y1={0.5} y2={0.5} stroke="#2b2622" strokeWidth={0.2} />
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs text-slate-500">
        <span>Front elevation (from the road)</span>
        <span>Height about {lenShort(height + 0.5, u)}</span>
      </figcaption>
    </figure>
  );
}
