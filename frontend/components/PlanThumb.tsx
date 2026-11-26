import { FILL, fitLabel, roomName } from '@/lib/rooms';

/** A floor plan drawn from room rectangles (ft). Road side at the bottom, like standing on the road. Every room is named;
 * rooms too small for their name get a number, listed in the key under the drawing. */
export interface PlanRoom { f: number; id: string; t: string; x: number; y: number; w: number; d: number }

export default function PlanThumb({ rooms, floor, envelope, labels = true, onRoom, selected }: {
  rooms: PlanRoom[]; floor: number; envelope: [number, number]; labels?: boolean; onRoom?: (id: string) => void; selected?: string | null;
}) {
  const [W, D] = envelope;
  const pad = 1;
  const flip = (y: number, d: number) => D - y - d; // road at the bottom
  const here = rooms.filter((r) => r.f === floor);
  const tagged: { n: number; name: string }[] = [];
  return (
    <div className="flex h-full flex-col">
      <svg viewBox={`${-pad} ${-pad} ${W + 2 * pad} ${D + 2 * pad + 2}`} className="min-h-0 w-full flex-1" role="img" aria-label={`Floor ${floor} plan`}>
        <rect x={0} y={0} width={W} height={D} fill="#FAFAF7" stroke="#334155" strokeWidth={0.35} strokeDasharray="0.8 0.6" />
        {here.map((r) => {
          const name = roomName(r.id, r.t, true);
          const size = labels ? fitLabel(name, r.w, r.d, 1.7, 0.8) : null;
          const n = labels && size === null ? tagged.push({ n: tagged.length + 1, name: roomName(r.id, r.t) }) : 0;
          const cx = r.x + r.w / 2, cy = flip(r.y, r.d) + r.d / 2;
          return (
            <g key={r.id} onClick={onRoom ? () => onRoom(r.id) : undefined} className={onRoom ? 'cursor-pointer' : undefined}
              tabIndex={onRoom ? 0 : undefined} onKeyDown={onRoom ? (e) => (e.key === 'Enter' || e.key === ' ') && onRoom(r.id) : undefined}
              aria-label={onRoom ? roomName(r.id, r.t) : undefined}>
              <title>{roomName(r.id, r.t)}</title>
              <rect x={r.x} y={flip(r.y, r.d)} width={r.w} height={r.d} fill={FILL[r.t] ?? '#EEE'}
                stroke={selected === r.id ? '#1D4ED8' : '#1F2937'} strokeWidth={selected === r.id ? 0.6 : 0.3} />
              {r.t === 'stair' && Array.from({ length: Math.floor(r.d / 1.2) }, (_, k) => (
                <line key={k} x1={r.x} x2={r.x + r.w} y1={flip(r.y, r.d) + k * 1.2} y2={flip(r.y, r.d) + k * 1.2} stroke="#6B7280" strokeWidth={0.12} />
              ))}
              {size !== null && (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={size} fill="#111827">{name}</text>
              )}
              {n > 0 && (
                <>
                  <circle cx={cx} cy={cy} r={Math.min(0.9, r.w / 2.2, r.d / 2.2)} fill="#111827" />
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(1, r.w / 2.4, r.d / 2.4)} fill="#fff">{n}</text>
                </>
              )}
            </g>
          );
        })}
        <text x={W / 2} y={D + 1.8} textAnchor="middle" fontSize={1.2} fill="#64748B">road ↓</text>
      </svg>
      {tagged.length > 0 && (
        <p className="mt-1 text-[11px] leading-snug text-muted">{tagged.map((t) => `${t.n} ${t.name}`).join(' · ')}</p>
      )}
    </div>
  );
}
