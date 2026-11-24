/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Paint / Decor / MEP / Climate / Sound views drawn over the plan, from the engines' output in the twin.
 * Plan coordinates: feet; toScreen maps a plan point to the SVG (road at the bottom).
 */
import { HouseTwin, Room } from '@/lib/twin';

export type LayerMode = 'paint' | 'decor' | 'mep' | 'climate' | 'sound';
type ToScreen = (x: number, y: number) => [number, number];

const CLIMATE_FILL: Record<string, string> = { hot: '#F8B4A0', warm: '#FCE3A6', cool: '#BFDCEB', interior: '#E5E7EB' };
const label = (s: string) => s.replace(/_\d+$/, '').replace(/_/g, ' ');

export function roomFill(mode: LayerMode, twin: HouseTwin, r: Room): string | null {
  const t = twin as any;
  if (mode === 'paint') return t.paint?.[r.name]?.walls?.find((w: any) => w.role === 'main')?.hex ?? '#F3F4F6';
  if (mode === 'climate') return CLIMATE_FILL[t.climate?.rooms?.[r.name]?.rating] ?? '#F3F4F6';
  if (mode === 'sound') {
    const s = t.sound?.rooms?.[r.name];
    if (!s || s.indoor_db == null || s.target_db == null) return '#F3F4F6';
    return s.indoor_db > s.target_db ? '#F8B4A0' : s.echo_risk ? '#FCE3A6' : '#BBE5C8';
  }
  if (mode === 'decor' || mode === 'mep') return '#FAFAF7';
  return null;
}

export function Overlay({ mode, twin, floor, toScreen }: { mode: LayerMode; twin: HouseTwin; floor: number; toScreen: ToScreen }) {
  const t = twin as any;
  const rooms = twin.floors.find((f) => f.floor_no === floor)?.rooms ?? [];
  const poly = (pts: number[][]) => pts.map(([x, y]) => toScreen(x, y).join(',')).join(' ');
  if (mode === 'paint') {
    return (
      <g>
        {rooms.map((r) => (t.paint?.[r.name]?.walls ?? []).map((w: any) => {
          const [x0, y0] = toScreen(r.x, r.y);
          const [x1, y1] = toScreen(r.x + r.length_ft, r.y + r.width_ft);
          const seg = { front: [x0, y0, x1, y0], rear: [x0, y1, x1, y1], left: [x0, y0, x0, y1], right: [x1, y0, x1, y1] }[w.side as string];
          return seg && <line key={r.name + w.side} x1={seg[0]} y1={seg[1]} x2={seg[2]} y2={seg[3]} stroke={w.hex} strokeWidth={w.role === 'accent' ? 0.9 : 0.45} />;
        }))}
      </g>
    );
  }
  if (mode === 'decor') {
    return (
      <g>
        {rooms.flatMap((r) => (t.furniture?.rooms?.[r.name]?.items ?? []).map((it: any, i: number) => {
          const [x, y] = toScreen(it.x, it.y + it.d);
          return (
            <g key={r.name + i}>
              <rect x={x} y={y} width={it.w} height={it.d} fill="#D9C7A7" stroke="#6B4F2A" strokeWidth={0.12} rx={0.2} />
              {it.w > 2.2 && <text x={x + it.w / 2} y={y + it.d / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(0.7, it.w / 6)} fill="#3F2E17">{it.item}</text>}
            </g>
          );
        }))}
      </g>
    );
  }
  if (mode === 'mep') {
    const m = t.mep_routes ?? {};
    const fl = m.floors?.[floor] ?? m.floors?.[String(floor)] ?? {};
    return (
      <g>
        {(fl.conduits ?? []).map((c: any) => <polyline key={'e' + c.room} points={poly(c.path)} fill="none" stroke="#EAB308" strokeWidth={0.15} />)}
        {(fl.water ?? []).map((c: any) => <polyline key={'w' + c.room} points={poly(c.path)} fill="none" stroke="#06B6D4" strokeWidth={0.2} strokeDasharray="0.5 0.3" />)}
        {(fl.drains ?? []).map((c: any) => <polyline key={'d' + c.room} points={poly(c.path)} fill="none" stroke="#1D4ED8" strokeWidth={0.35} />)}
        {(m.stacks ?? []).map((s: number[], i: number) => { const [x, y] = toScreen(s[0], s[1]); return <circle key={'s' + i} cx={x} cy={y} r={0.6} fill="#1D4ED8"><title>Soil/waste stack</title></circle>; })}
        {m.distribution_board && floor === 0 && (() => { const [x, y] = toScreen(m.distribution_board[0], m.distribution_board[1]); return <rect x={x - 0.5} y={y - 0.5} width={1} height={1} fill="#CA8A04"><title>Distribution board</title></rect>; })()}
        {m.overhead_tank && (() => { const [x, y] = toScreen(m.overhead_tank[0], m.overhead_tank[1]); return <circle cx={x} cy={y} r={0.5} fill="#06B6D4" stroke="#fff" strokeWidth={0.1}><title>Water down-take from overhead tank</title></circle>; })()}
      </g>
    );
  }
  if (mode === 'climate') {
    return (
      <g>
        {rooms.map((r) => {
          const c = t.climate?.rooms?.[r.name];
          if (!c?.overhang_m || !Object.keys(c.overhang_m).length) return null;
          const [x, y] = toScreen(r.x + r.length_ft / 2, r.y + r.width_ft / 2);
          return <text key={r.name} x={x} y={y + 1.8} textAnchor="middle" fontSize={0.75} fill="#9A3412">☂ {Object.entries(c.overhang_m).map(([d, v]) => `${d} ${v}m`).join(' ')}</text>;
        })}
      </g>
    );
  }
  return null;
}

export function SunPath({ climate }: { climate: any }) {
  if (!climate?.sun_path) return null;
  const R = 40;
  const pt = (alt: number, az: number): [number, number] => {
    const r = R * (1 - alt / 90);
    const a = ((az - 90) * Math.PI) / 180;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  };
  const colours: Record<string, string> = { summer: '#DC2626', equinox: '#D97706', winter: '#2563EB' };
  return (
    <svg viewBox="0 0 100 100" className="h-44 w-44" role="img" aria-label="Sun path diagram">
      {[0, 30, 60].map((a) => <circle key={a} cx={50} cy={50} r={R * (1 - a / 90)} fill="none" stroke="#475569" strokeWidth={0.4} />)}
      {['N', 'E', 'S', 'W'].map((d, i) => { const [x, y] = pt(-12, i * 90); return <text key={d} x={x} y={y} fontSize={5} fill="#cbd5e1" textAnchor="middle" dominantBaseline="middle">{d}</text>; })}
      {Object.entries(climate.sun_path).map(([k, pts]: [string, any]) => (
        <polyline key={k} points={pts.map((p: any) => pt(p.alt, p.az).join(',')).join(' ')} fill="none" stroke={colours[k] ?? '#999'} strokeWidth={1.2} />
      ))}
    </svg>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-2 border-b border-slate-800/60 py-1 font-mono text-xs"><span className="text-slate-400">{k}</span><span className="text-right text-white">{v}</span></div>;
}

export function RoomDetail({ mode, twin, room }: { mode: LayerMode; twin: HouseTwin; room: Room }) {
  const t = twin as any;
  if (mode === 'paint') {
    const p = t.paint?.[room.name];
    const mat = t.materials?.rooms?.[room.name];
    return (
      <div className="space-y-1">
        {(p?.walls ?? []).map((w: any) => (
          <div key={w.side} className="flex items-center justify-between font-mono text-xs text-slate-300">
            <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-slate-500 align-middle" style={{ background: w.hex }} />{w.side} wall ({w.faces}) {w.role === 'accent' ? '· accent' : ''}</span>
            <span>{w.hex} · LRV {w.lrv} · L*a*b* {w.lab.join('/')}</span>
          </div>
        ))}
        {p && <p className="pt-1 text-xs text-slate-400">{p.why} Palette harmony: {p.harmony}.</p>}
        {mat && (
          <div className="pt-2 text-xs text-slate-300">
            <p className="font-semibold text-white">Floor: {mat.chosen.name} (₹{mat.chosen.cost_sqft[0]}–{mat.chosen.cost_sqft[1]}/sqft)</p>
            <p className="text-emerald-400">+ {mat.chosen.benefits}</p>
            <p className="text-amber-400">− {mat.chosen.risks}</p>
            <p className="text-slate-400">Care: {mat.chosen.maintenance}. Also good: {mat.alternatives.map((a: any) => a.name).join(', ')}.</p>
          </div>
        )}
      </div>
    );
  }
  if (mode === 'decor') {
    const f = t.furniture?.rooms?.[room.name];
    return f ? (
      <div className="text-xs text-slate-300">
        <KV k="Furniture" v={f.items.map((i: any) => i.item).join(', ') || '—'} />
        {f.did_not_fit?.length > 0 && <KV k="Didn't fit" v={f.did_not_fit.join(', ')} />}
        {f.triangle_ft && <KV k="Work triangle" v={`${f.triangle_ft} ft (limit 22)`} />}
        <KV k="Door on" v={`${f.door_wall} wall`} />
      </div>
    ) : <p className="text-xs text-slate-400">No furniture for this space.</p>;
  }
  if (mode === 'mep') {
    return (
      <div className="text-xs">
        <KV k="Electrical points" v={String(twin.mep.electrical_points)} />
        <KV k="Connected load" v={`${t.mep_routes?.connected_load_kw ?? '—'} kW`} />
        <KV k="Pump head" v={`${twin.mep.pump_head_m} m`} />
        <KV k="Water main / branch" v={`${t.mep_routes?.main_water_mm} / ${t.mep_routes?.branch_water_mm} mm`} />
      </div>
    );
  }
  if (mode === 'climate') {
    const c = t.climate?.rooms?.[room.name];
    return c ? (
      <div className="text-xs">
        <KV k="Outside walls face" v={c.outside_walls?.join(', ') || 'none'} />
        <KV k="Summer sun through windows" v={`${c.solar_gain_kwh} kWh/day`} />
        <KV k="Rating" v={c.rating} />
        <KV k="Cross-ventilation" v={c.cross_ventilation ? 'yes' : 'no'} />
        {c.overhang_m && Object.keys(c.overhang_m).length > 0 && <KV k="Overhang" v={Object.entries(c.overhang_m).map(([d, v]) => `${d}: ${v} m`).join(', ')} />}
      </div>
    ) : null;
  }
  const s = t.sound?.rooms?.[room.name];
  return s ? (
    <div className="text-xs">
      <KV k="Outside at facade" v={`${s.outside_db} dB`} />
      <KV k="Inside (windows shut)" v={s.indoor_db != null ? `${s.indoor_db} dB${s.target_db ? ` (target ≤ ${s.target_db})` : ''}` : '—'} />
      <KV k="Glazing" v={s.glazing} />
      <KV k="Echo (RT60)" v={`${s.rt60_s} s${s.target_rt60_s ? ` (target ≤ ${s.target_rt60_s})` : ''}`} />
      {s.noisy_neighbours?.length > 0 && <KV k="Noisy neighbours" v={s.noisy_neighbours.map((n: any) => label(n[0])).join(', ')} />}
    </div>
  ) : null;
}

export function Legend({ mode }: { mode: LayerMode }) {
  const items: Record<LayerMode, [string, string][]> = {
    paint: [['Main wall', '#E5E7EB'], ['Accent wall', '#8B3A1F']],
    decor: [['Furniture', '#D9C7A7']],
    mep: [['Drain', '#1D4ED8'], ['Water', '#06B6D4'], ['Electrical', '#EAB308']],
    climate: [['Hot', CLIMATE_FILL.hot], ['Warm', CLIMATE_FILL.warm], ['Cool', CLIMATE_FILL.cool]],
    sound: [['Too loud', '#F8B4A0'], ['Echoey', '#FCE3A6'], ['Quiet', '#BBE5C8']],
  };
  return (
    <div className="flex flex-wrap gap-3 px-3 pb-2 text-xs text-slate-600">
      {items[mode].map(([k, c]) => <span key={k} className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: c }} />{k}</span>)}
    </div>
  );
}
