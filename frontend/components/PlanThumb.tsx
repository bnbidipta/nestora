/** A floor plan drawn from room rectangles (ft). Road side at the bottom, like standing on the road. */
const FILL: Record<string, string> = {
  living: '#E8DCC4', lounge: '#E8DCC4', dining: '#EFE3CB', kitchen: '#F3C9A5', bedroom: '#C9D8C5', bedroom_master: '#B7CDB2',
  bedroom_elder: '#A9C7B8', study: '#D4DCE8', toilet: '#BFD9E6', stair: '#9CA3AF', lift: '#7C8594', passage: '#F1F1EE', porch: '#D6D3CC',
  entrance: '#E4E0D6', puja: '#F4D47A', balcony: '#DCE9D5', utility: '#E5E5E2', help: '#D9D2E6', laundry: '#CFE3EC', store: '#E2DED7',
};
const SHORT: Record<string, string> = {
  living: 'Living', lounge: 'Lounge', dining: 'Dining', kitchen: 'Kitchen', bedroom: 'Bed', bedroom_master: 'Master', bedroom_elder: 'Elder',
  study: 'Study', toilet: 'WC', stair: 'Stair', lift: 'Lift', passage: '', porch: 'Car', entrance: 'Entry', puja: 'Puja', balcony: 'Balc.', utility: '',
  help: 'Help', laundry: 'Wash', store: 'Store',
};

export interface PlanRoom { f: number; id: string; t: string; x: number; y: number; w: number; d: number }

export default function PlanThumb({ rooms, floor, envelope, labels = true, onRoom, selected }: {
  rooms: PlanRoom[]; floor: number; envelope: [number, number]; labels?: boolean; onRoom?: (id: string) => void; selected?: string | null;
}) {
  const [W, D] = envelope;
  const pad = 1;
  const flip = (y: number, d: number) => D - y - d; // road at the bottom
  return (
    <svg viewBox={`${-pad} ${-pad} ${W + 2 * pad} ${D + 2 * pad + 2}`} className="h-full w-full" role="img" aria-label={`Floor ${floor} plan`}>
      <rect x={0} y={0} width={W} height={D} fill="#FAFAF7" stroke="#334155" strokeWidth={0.35} strokeDasharray="0.8 0.6" />
      {rooms.filter((r) => r.f === floor).map((r) => (
        <g key={r.id} onClick={onRoom ? () => onRoom(r.id) : undefined} className={onRoom ? 'cursor-pointer' : undefined}
          tabIndex={onRoom ? 0 : undefined} onKeyDown={onRoom ? (e) => (e.key === 'Enter' || e.key === ' ') && onRoom(r.id) : undefined}
          aria-label={onRoom ? `${r.id.replace(/_/g, ' ')} ${r.w}×${r.d} ft` : undefined}>
          <rect x={r.x} y={flip(r.y, r.d)} width={r.w} height={r.d} fill={FILL[r.t] ?? '#EEE'}
            stroke={selected === r.id ? '#1D4ED8' : '#1F2937'} strokeWidth={selected === r.id ? 0.6 : 0.3} />
          {r.t === 'stair' && Array.from({ length: Math.floor(r.d / 1.2) }, (_, k) => (
            <line key={k} x1={r.x} x2={r.x + r.w} y1={flip(r.y, r.d) + k * 1.2} y2={flip(r.y, r.d) + k * 1.2} stroke="#6B7280" strokeWidth={0.12} />
          ))}
          {labels && SHORT[r.t] && r.w > 3.2 && (
            <text x={r.x + r.w / 2} y={flip(r.y, r.d) + r.d / 2} textAnchor="middle" dominantBaseline="middle"
              fontSize={Math.min(1.7, r.w / 4.2)} fill="#111827" fontFamily="ui-sans-serif, system-ui">
              {SHORT[r.t]}
            </text>
          )}
        </g>
      ))}
      <text x={W / 2} y={D + 1.8} textAnchor="middle" fontSize={1.2} fill="#64748B">road ↓</text>
    </svg>
  );
}
