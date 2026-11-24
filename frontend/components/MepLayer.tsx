'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Services drawing: water supply, drainage and electrical as separate layers, with standard-style symbols.
 * Data from the backend MEP engine (twin.mep_routes), plan feet; toScreen maps plan points into the SVG.
 */
import { HouseTwin } from '@/lib/twin';

export type MepLayer = 'water' | 'drain' | 'power';
type ToScreen = (x: number, y: number) => [number, number];
const C = { water: '#0891B2', hot: '#DC2626', drain: '#1D4ED8', soil: '#1E3A8A', power: '#CA8A04', site: '#475569' };

function Arrow({ a, b, colour }: { a: [number, number]; b: [number, number]; colour: string }) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1.2) return null;
  return <polygon points="-0.35,-0.25 0.35,0 -0.35,0.25" fill={colour} transform={`translate(${mx},${my}) rotate(${ang})`} />;
}

/** One symbol, drawn around (x, y) in SVG units (1 = 1 ft). */
function Symbol({ kind, x, y }: { kind: string; x: number; y: number }) {
  const t = `translate(${x},${y})`;
  switch (kind) {
    case 'wc': return <g transform={t}><rect x={-0.55} y={-0.8} width={1.1} height={0.45} fill="#fff" stroke={C.drain} strokeWidth={0.1} /><ellipse cx={0} cy={0.1} rx={0.5} ry={0.6} fill="#fff" stroke={C.drain} strokeWidth={0.1} /></g>;
    case 'basin': return <g transform={t}><path d="M -0.6 -0.3 L 0.6 -0.3 A 0.6 0.6 0 0 1 -0.6 -0.3 Z" fill="#fff" stroke={C.drain} strokeWidth={0.1} /></g>;
    case 'sink': return <g transform={t}><rect x={-0.8} y={-0.45} width={1.6} height={0.9} rx={0.15} fill="#fff" stroke={C.drain} strokeWidth={0.1} /><circle r={0.12} fill={C.drain} /></g>;
    case 'floor_trap': return <g transform={t}><rect x={-0.35} y={-0.35} width={0.7} height={0.7} fill="#fff" stroke={C.drain} strokeWidth={0.1} /><path d="M -0.35 -0.35 L 0.35 0.35 M 0.35 -0.35 L -0.35 0.35" stroke={C.drain} strokeWidth={0.08} /></g>;
    case 'tap': return <g transform={t}><circle r={0.3} fill="#fff" stroke={C.water} strokeWidth={0.1} /><text textAnchor="middle" dominantBaseline="central" fontSize={0.4} fill={C.water}>T</text></g>;
    case 'geyser': return <g transform={t}><rect x={-0.35} y={-0.45} width={0.7} height={0.9} rx={0.2} fill="#fff" stroke={C.hot} strokeWidth={0.1} /><text textAnchor="middle" dominantBaseline="central" fontSize={0.4} fill={C.hot}>G</text></g>;
    case 'switchboard': return <g transform={t}><rect x={-0.45} y={-0.22} width={0.9} height={0.44} fill={C.power} /><text textAnchor="middle" dominantBaseline="central" fontSize={0.3} fill="#fff">SB</text></g>;
    case 'socket': return <g transform={t}><circle r={0.28} fill="#fff" stroke={C.power} strokeWidth={0.09} /><path d="M -0.1 -0.08 L -0.1 0.08 M 0.1 -0.08 L 0.1 0.08" stroke={C.power} strokeWidth={0.07} /></g>;
    case 'light': return <g transform={t}><circle r={0.35} fill="#FEF9C3" stroke={C.power} strokeWidth={0.08} /><path d="M -0.25 -0.25 L 0.25 0.25 M 0.25 -0.25 L -0.25 0.25" stroke={C.power} strokeWidth={0.07} /></g>;
    case 'fan': return <g transform={t}><circle r={0.12} fill={C.power} />{[0, 120, 240].map((a) => <ellipse key={a} cx={0} cy={-0.38} rx={0.12} ry={0.3} fill="none" stroke={C.power} strokeWidth={0.07} transform={`rotate(${a})`} />)}</g>;
    case 'ac': return <g transform={t}><rect x={-0.6} y={-0.2} width={1.2} height={0.4} fill="#fff" stroke={C.power} strokeWidth={0.09} /><text textAnchor="middle" dominantBaseline="central" fontSize={0.28} fill={C.power}>AC</text></g>;
    default: return null;
  }
}

const KIND_LAYER: Record<string, MepLayer> = {
  wc: 'drain', basin: 'drain', sink: 'drain', floor_trap: 'drain', tap: 'water', geyser: 'water',
  switchboard: 'power', socket: 'power', light: 'power', fan: 'power', ac: 'power',
};

export function MepOverlay({ twin, floor, toScreen, layers }: { twin: HouseTwin; floor: number; toScreen: ToScreen; layers: Set<MepLayer> }) {
  const m = (twin as any).mep_routes ?? {};
  const fl = m.floors?.[floor] ?? m.floors?.[String(floor)] ?? {};
  const scr = (p: number[]) => toScreen(p[0], p[1]);
  const pts = (path: number[][]) => path.map((p) => scr(p).join(',')).join(' ');
  const ground = floor === 0;
  const site = (p: number[] | undefined, label: string, colour: string, w = 2.2, h = 1.1) => {
    if (!p) return null;
    const [x, y] = scr(p);
    return <g><rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#fff" stroke={colour} strokeWidth={0.12} strokeDasharray="0.3 0.2" /><text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={0.5} fill={colour}>{label}</text></g>;
  };
  return (
    <g>
      {layers.has('power') && (fl.conduits ?? []).map((c: any, i: number) => (
        <polyline key={'e' + i} points={pts(c.path)} fill="none" stroke={C.power} strokeWidth={c.kind === 'circuit' ? 0.16 : 0.09} strokeDasharray={c.kind === 'circuit' ? undefined : '0.35 0.25'} />
      ))}
      {layers.has('water') && (fl.water ?? []).map((c: any, i: number) => (
        <polyline key={'w' + i} points={pts(c.path)} fill="none" stroke={c.hot ? C.hot : C.water} strokeWidth={0.14} strokeDasharray={c.hot ? '0.4 0.2' : undefined} />
      ))}
      {layers.has('drain') && (fl.drains ?? []).map((c: any, i: number) => (
        <g key={'d' + i}>
          <polyline points={pts(c.path)} fill="none" stroke={c.kind === 'soil' ? C.soil : C.drain} strokeWidth={c.kind === 'soil' ? 0.3 : 0.2} />
          {c.path.slice(1).map((p: number[], k: number) => <Arrow key={k} a={scr(c.path[k])} b={scr(p)} colour={c.kind === 'soil' ? C.soil : C.drain} />)}
        </g>
      ))}
      {layers.has('drain') && (m.stacks ?? []).map((s: number[], i: number) => { const [x, y] = scr(s); return <circle key={'s' + i} cx={x} cy={y} r={0.45} fill={C.soil}><title>Soil / waste stack</title></circle>; })}
      {ground && layers.has('drain') && (
        <g>
          {(m.underground ?? []).map((p: number[][], i: number) => <polyline key={'u' + i} points={pts(p)} fill="none" stroke={C.soil} strokeWidth={0.2} strokeDasharray="0.6 0.3" />)}
          {(m.sewer_runs ?? (m.sewer?.length > 1 ? [m.sewer] : [])).map((p: number[][], i: number) => <polyline key={'sw' + i} points={pts(p)} fill="none" stroke={C.soil} strokeWidth={0.25} strokeDasharray="0.6 0.3" />)}
          {(m.inspection_chambers ?? []).map((c: number[], i: number) => { const [x, y] = scr(c); return <g key={'ic' + i}><rect x={x - 0.5} y={y - 0.5} width={1} height={1} fill="#fff" stroke={C.soil} strokeWidth={0.12} /><rect x={x - 0.3} y={y - 0.3} width={0.6} height={0.6} fill="none" stroke={C.soil} strokeWidth={0.08} /><title>Inspection chamber</title></g>; })}
        </g>
      )}
      {ground && layers.has('water') && (
        <g>
          {m.pump_line && <polyline points={pts(m.pump_line)} fill="none" stroke={C.water} strokeWidth={0.18} strokeDasharray="0.5 0.25" />}
          {site(m.sump, 'Sump', C.water)}
        </g>
      )}
      {layers.has('water') && m.overhead_tank && (() => { const [x, y] = scr(m.overhead_tank); return <g><circle cx={x} cy={y} r={0.45} fill={C.water} stroke="#fff" strokeWidth={0.1} /><title>Down-take from the overhead tank (on the roof, above the stair)</title></g>; })()}
      {ground && layers.has('power') && site(m.meter, 'Meter', C.power, 2, 0.9)}
      {ground && layers.has('power') && m.distribution_board && (() => { const [x, y] = scr(m.distribution_board); return <g><rect x={x - 0.6} y={y - 0.3} width={1.2} height={0.6} fill="#713F12" /><text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={0.34} fill="#fff">DB</text></g>; })()}
      {(fl.fixtures ?? []).filter((f: any) => layers.has(KIND_LAYER[f.kind])).map((f: any, i: number) => {
        const [x, y] = scr([f.x, f.y]);
        return <g key={'f' + i}><Symbol kind={f.kind} x={x} y={y} /><title>{(f.label ?? f.kind).replace('_', ' ')}</title></g>;
      })}
    </g>
  );
}

const LEGEND: Record<MepLayer, [string, string][]> = {
  water: [['tap', 'Tap'], ['geyser', 'Geyser'], ['line-water', 'Cold water 20 mm (main 25 mm)'], ['line-hot', 'Hot water 15 mm'], ['sump', 'Sump → overhead tank']],
  drain: [['wc', 'WC'], ['basin', 'Wash basin'], ['sink', 'Sink'], ['floor_trap', 'Floor trap'], ['line-soil', 'Soil 110 mm, slope 1:60'], ['line-waste', 'Waste 50–75 mm, slope 1:80'], ['ic', 'Inspection chamber → sewer']],
  power: [['switchboard', 'Switchboard'], ['socket', 'Socket'], ['light', 'Light'], ['fan', 'Fan'], ['ac', 'AC point'], ['line-power', 'Circuit from the board (DB)']],
};

export function MepLegend({ layers, toggle, loadKw }: { layers: Set<MepLayer>; toggle: (l: MepLayer) => void; loadKw?: number }) {
  const names: Record<MepLayer, string> = { water: 'Water supply', drain: 'Drainage', power: 'Electrical' };
  return (
    <div className="space-y-2 px-3 pb-3 text-xs text-slate-700">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Services layers">
        {(Object.keys(names) as MepLayer[]).map((l) => (
          <button key={l} type="button" aria-pressed={layers.has(l)} onClick={() => toggle(l)}
            className={`rounded-full border px-3 py-1 font-semibold ${layers.has(l) ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-600'}`}>
            {names[l]}
          </button>
        ))}
        {loadKw != null && <span className="self-center text-slate-500">Connected load about {loadKw} kW</span>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {(Object.keys(LEGEND) as MepLayer[]).filter((l) => layers.has(l)).flatMap((l) => LEGEND[l]).map(([k, text]) => (
          <span key={k} className="flex items-center gap-1.5">
            <svg viewBox="-1 -1 2 2" className="h-4 w-4">
              {k.startsWith('line-') ? (
                <line x1={-0.9} y1={0} x2={0.9} y2={0} stroke={{ 'line-water': C.water, 'line-hot': C.hot, 'line-soil': C.soil, 'line-waste': C.drain, 'line-power': C.power }[k]} strokeWidth={0.3} strokeDasharray={k === 'line-hot' ? '0.4 0.2' : undefined} />
              ) : k === 'ic' ? <rect x={-0.6} y={-0.6} width={1.2} height={1.2} fill="#fff" stroke={C.soil} strokeWidth={0.15} />
                : k === 'sump' ? <rect x={-0.8} y={-0.5} width={1.6} height={1} fill="#fff" stroke={C.water} strokeWidth={0.15} strokeDasharray="0.3 0.2" />
                : <Symbol kind={k} x={0} y={0} />}
            </svg>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
