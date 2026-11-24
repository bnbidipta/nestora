'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box, ChevronRight, Copy, Download, FlipHorizontal, Info, Layers, Lightbulb, Minus, Palette, Plus, Printer, Ruler, Share2, ShieldCheck, Sofa, Sun, Volume2, Zap } from 'lucide-react';
import { LayerMode, Legend, Overlay, RoomDetail, SunPath, roomFill } from '@/components/ModeLayers';
import { HouseTwin, getJudge, builtUpSqft } from '@/lib/twin';
import { canEditLocally, dxfUrl, editHouse, getHouse } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

type ViewMode = 'plan' | 'structure' | '3d' | LayerMode;
const LAYERS: string[] = ['paint', 'decor', 'mep', 'climate', 'sound'];
type Decision = { field: string; value: string | number; source: string; reason: string; rule?: string };
type TraditionPack = { mode: string; score: number; verified: boolean; findings: { rule: string; status: string; why: string }[] };

const FILL: Record<string, string> = {
  living: '#E8DCC4', lounge: '#E8DCC4', dining: '#EFE3CB', kitchen: '#F3C9A5', bedroom: '#C9D8C5', bedroom_master: '#B7CDB2',
  bedroom_elder: '#A9C7B8', study: '#D4DCE8', toilet: '#BFD9E6', stair: '#9CA3AF', lift: '#7C8594', passage: '#F1F1EE', porch: '#D6D3CC',
  entrance: '#E4E0D6', puja: '#F4D47A', balcony: '#DCE9D5', utility: '#E5E5E2', help: '#D9D2E6', laundry: '#CFE3EC', store: '#E2DED7',
};
const NORTH_ROT: Record<string, number> = { South: 0, East: 90, North: 180, West: 270 };
const label = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function Viewer({ twin: initial }: { twin: HouseTwin }) {
  const [twin, setTwin] = useState(initial);
  const [mode, setMode] = useState<ViewMode>('plan');
  const [floorNo, setFloorNo] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Editable by the creating browser (edit token) or a signed-in owner; the API enforces it either way.
    supabase.auth.getSession().then(({ data }) => setCanEdit(canEditLocally(twin.house_id) || !!data.session));
  }, [twin.house_id]);

  const md = twin.metadata ?? {};
  const W = Number(md.envelope_width_ft ?? twin.plot.plot_width_ft);
  const D = Number(md.envelope_depth_ft ?? twin.plot.plot_depth_ft);
  const sbSide = Number(md.setback_side_m ?? 0) * 3.28084;
  const sbFront = Number(md.setback_front_m ?? 0) * 3.28084;
  const PW = twin.plot.plot_width_ft;
  const PD = twin.plot.plot_depth_ft;
  const judge = getJudge(twin);
  const builtUp = Number(md.fsi_built_up_sqft ?? builtUpSqft(twin));
  const floor = twin.floors.find((f) => f.floor_no === floorNo) ?? twin.floors[0];
  const room = floor?.rooms.find((r) => r.name === selected) ?? null;
  const decisions = (md.decisions ?? []) as Decision[];
  const trads = (md.traditions ?? {}) as Record<string, TraditionPack>;
  // Plan coordinates: plot origin top-left on screen, road at the bottom.
  const px = (x: number) => sbSide + x;
  const py = (y: number, d: number) => PD - sbFront - y - d;

  useEffect(() => {
    if (mode !== '3d' || !mountRef.current) return;
    const el = mountRef.current;
    const w = el.clientWidth, h = el.clientHeight || 480;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f6f2);
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 2000);
    const r = Math.max(W, D) * 1.6;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8577, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(r, r, r / 2);
    scene.add(sun);
    const group = new THREE.Group();
    const disposables: { dispose: () => void }[] = [];
    twin.floors.forEach((f) => {
      const fh = f.floor_height_ft;
      f.rooms.forEach((rm) => {
        const g = new THREE.BoxGeometry(rm.length_ft - 0.4, fh - 0.6, rm.width_ft - 0.4);
        const m = new THREE.MeshStandardMaterial({ color: FILL[rm.type ?? ''] ?? '#e5e5e5', transparent: f.floor_no > 0, opacity: f.floor_no > 0 ? 0.92 : 1 });
        const mesh = new THREE.Mesh(g, m);
        mesh.position.set(rm.x + rm.length_ft / 2 - W / 2, f.floor_no * fh + fh / 2, -(rm.y + rm.width_ft / 2 - D / 2));
        group.add(mesh);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x334155 }));
        edges.position.copy(mesh.position);
        group.add(edges);
        disposables.push(g, m, edges.geometry, edges.material as THREE.Material);
      });
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshStandardMaterial({ color: 0xd9d4c7 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(sbSide + W / 2 - PW / 2, -0.01, -(PD / 2 - sbFront - D / 2));
    disposables.push(ground.geometry, ground.material as THREE.Material);
    scene.add(group, ground);
    let angle = 0.8, drag: number | null = null, raf = 0, visible = true;
    const onDown = (e: PointerEvent) => { drag = e.clientX; };
    const onMove = (e: PointerEvent) => { if (drag !== null) { angle += (e.clientX - drag) * 0.01; drag = e.clientX; } };
    const onUp = () => { drag = null; };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      if (drag === null) angle += 0.002;
      camera.position.set(Math.sin(angle) * r, r * 0.7, Math.cos(angle) * r);
      camera.lookAt(0, twin.floors.length * 4, 0);
      renderer.render(scene, camera);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [mode, twin, W, D, PW, PD, sbSide, sbFront]);

  const edit = async (action: 'grow' | 'shrink' | 'mirror') => {
    setBusy(true);
    setMsg(null);
    try {
      await editHouse(twin.house_id, action, action === 'mirror' ? undefined : selected ?? undefined);
      setTwin(await getHouse(twin.house_id));
      track('design_edited', { action });
      setMsg('Updated and re-checked.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not apply that change.');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const url = window.location.href.split('?')[0];
    try {
      await navigator.clipboard.writeText(url);
      setMsg('Link copied.');
    } catch {
      setMsg(url);
    }
    track('design_shared', { via: 'copy' });
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row print:block">
      <div className="flex-1 rounded-2xl border border-slate-800 bg-[#131926] p-4 sm:p-6 print:border-0 print:bg-white print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 print:hidden">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="View">
            {([['plan', 'Plan', Ruler], ['structure', 'Structure', Layers], ['mep', 'MEP', Zap], ['paint', 'Paint', Palette], ['decor', 'Decor', Sofa], ['climate', 'Climate', Sun], ['sound', 'Sound', Volume2], ['3d', '3D massing', Box]] as const).map(([id, text, Icon]) => (
              <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs ${mode === id ? 'bg-blue-600 text-white' : 'border border-slate-700 text-slate-300 hover:text-white'}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden />{text}
              </button>
            ))}
          </div>
          {mode !== '3d' && (
            <div className="flex gap-1.5" role="tablist" aria-label="Floor">
              {twin.floors.map((f) => (
                <button key={f.floor_no} type="button" role="tab" aria-selected={f.floor_no === floorNo} onClick={() => { setFloorNo(f.floor_no); setSelected(null); }}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs ${f.floor_no === floorNo ? 'bg-white text-slate-900' : 'border border-slate-700 text-slate-300'}`}>
                  {f.floor_no === 0 ? 'Ground' : `Floor ${f.floor_no}`}
                </button>
              ))}
            </div>
          )}
          <span className={`flex items-center gap-1 font-mono text-xs ${judge?.pass ? 'text-emerald-400' : 'text-red-400'}`}>
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {judge ? (judge.pass ? 'Automated checks passed' : `${judge.failures.length} check(s) failed`) : 'Not checked yet'}
          </span>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-xl bg-[#FAFAF7] print:mt-0">
          {mode === '3d' ? (
            <div ref={mountRef} className="h-[480px] w-full cursor-grab active:cursor-grabbing" aria-label="3D massing model, drag to rotate" />
          ) : (
            <svg viewBox={`-3 -3 ${PW + 10} ${PD + 8}`} className="max-h-[560px] w-full" role="img" aria-label={`Floor ${floorNo} plan`}>
              <rect x={0} y={0} width={PW} height={PD} fill="#EFEDE6" stroke="#475569" strokeWidth={0.25} strokeDasharray="1 0.6" />
              <rect x={sbSide} y={PD - sbFront - D} width={W} height={D} fill="none" stroke="#D97706" strokeWidth={0.2} strokeDasharray="0.6 0.4" />
              {floor?.rooms.map((r) => (
                <g key={r.name} onClick={() => setSelected(r.name)} tabIndex={0} role="button" aria-label={`${label(r.name)}, ${r.length_ft} by ${r.width_ft} feet`}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(r.name)} className="cursor-pointer focus:outline-none">
                  <rect x={px(r.x)} y={py(r.y, r.width_ft)} width={r.length_ft} height={r.width_ft} fill={(LAYERS.includes(mode) ? roomFill(mode as LayerMode, twin, r) : null) ?? FILL[r.type ?? ''] ?? '#EEE'}
                    stroke={selected === r.name ? '#1D4ED8' : '#1F2937'} strokeWidth={selected === r.name ? 0.5 : 0.25} />
                  {r.length_ft > 4 && r.type !== 'passage' && r.type !== 'utility' && (
                    <>
                      <text x={px(r.x) + r.length_ft / 2} y={py(r.y, r.width_ft) + r.width_ft / 2 - 0.4} textAnchor="middle" fontSize={Math.min(1.3, r.length_ft / 7)} fontWeight={600} fill="#111827">{label(r.name)}</text>
                      <text x={px(r.x) + r.length_ft / 2} y={py(r.y, r.width_ft) + r.width_ft / 2 + 1.1} textAnchor="middle" fontSize={Math.min(1.0, r.length_ft / 9)} fill="#374151">
                        {r.length_ft.toFixed(1)}′×{r.width_ft.toFixed(1)}′
                      </text>
                    </>
                  )}
                </g>
              ))}
              {LAYERS.includes(mode) && <Overlay mode={mode as LayerMode} twin={twin} floor={floorNo} toScreen={(x, y) => [px(x), PD - sbFront - y]} />}
              {mode === 'structure' && twin.structure.columns.map((c, i) => (
                <rect key={i} x={px(c.x) - 0.4} y={PD - sbFront - c.y - 0.4} width={0.8} height={((c.size_y_mm ?? 230) / 304.8)} fill="#1D4ED8">
                  <title>{`C${i + 1}: 230×${c.size_y_mm ?? 230} mm, ${c.load_tons} t`}</title>
                </rect>
              ))}
              <text x={PW / 2} y={PD + 2.6} textAnchor="middle" fontSize={1.2} fill="#64748B">Road ({twin.plot.orientation} side) · plot {PW}′×{PD}′ · dashed orange = setback line</text>
              <g transform={`translate(${PW + 3.5}, 3) rotate(${NORTH_ROT[twin.plot.orientation] ?? 0})`} aria-label="North arrow">
                <circle r={2} fill="#fff" stroke="#475569" strokeWidth={0.15} />
                <polygon points="0,-1.7 -0.7,0.6 0.7,0.6" fill="#DC2626" />
                <text y={-2.3} textAnchor="middle" fontSize={1} fill="#111827">N</text>
              </g>
            </svg>
          )}
          {LAYERS.includes(mode) && (
            <Legend mode={mode as LayerMode} />
          )}
        </div>
      </div>

      <aside className="w-full rounded-2xl border border-slate-800 bg-[#131926] p-5 lg:w-80 print:mt-6 print:w-full print:border-0 print:bg-white print:text-black">
        {room ? (
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase text-blue-400">Selected room</p>
            <h3 className="text-lg font-bold text-white">{label(room.name)}</h3>
            <Row k="Size" v={`${room.length_ft}′ × ${room.width_ft}′ (${room.area_sqft} sqft)`} />
            <Row k="Door" v={`${room.door_width_mm} mm`} />
            <Row k="Window" v={room.window_area_sqft ? `${room.window_area_sqft} sqft` : room.exterior ? 'Vent' : 'Internal (duct/exhaust)'} />
            <Row k="Direction" v={room.compass ?? '—'} />
            <Row k="Floor finish" v={label(room.material_floor)} />
            <Row k="Wall" v={`${room.color_wall_A?.hex ?? ''} · LRV ${room.color_wall_A?.lrv}`} swatch={room.color_wall_A?.hex} />
            {LAYERS.includes(mode) && <div className="pt-2"><RoomDetail mode={mode as LayerMode} twin={twin} room={room} /></div>}
            {canEdit && room.type !== 'stair' && room.type !== 'utility' && (
              <div className="flex gap-2 pt-2 print:hidden">
                <button type="button" disabled={busy} onClick={() => edit('grow')} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-600 px-2 py-1.5 text-xs text-white hover:bg-slate-800 disabled:opacity-50"><Plus className="h-3.5 w-3.5" />Bigger</button>
                <button type="button" disabled={busy} onClick={() => edit('shrink')} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-600 px-2 py-1.5 text-xs text-white hover:bg-slate-800 disabled:opacity-50"><Minus className="h-3.5 w-3.5" />Smaller</button>
              </div>
            )}
            <button type="button" onClick={() => setSelected(null)} className="text-xs text-slate-400 underline print:hidden">Back to overview</button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2"><Info className="h-4 w-4 text-blue-400" /><h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">Why this design</h3></div>
            <Row k="Plot" v={`${PW}′ × ${PD}′ (${twin.plot.plot_area_sqft.toLocaleString('en-IN')} sqft)`} />
            <Row k="Built-up (FSI)" v={`${Math.round(builtUp).toLocaleString('en-IN')} sqft (${(builtUp / twin.plot.plot_area_sqft).toFixed(2)})`} />
            <Row k="Foundation" v={`${twin.structure.foundation.type}, ${twin.structure.foundation.depth_ft} ft`} />
            <Row k="Columns" v={`${twin.structure.columns.length}`} />
            {mode === 'climate' && (
              <div className="flex flex-col items-center pt-2">
                <SunPath climate={(twin as any).climate} />
                <p className="text-center text-[11px] text-slate-400"><span className="text-red-400">June</span> · <span className="text-amber-400">March/Sept</span> · <span className="text-blue-400">December</span> sun path</p>
              </div>
            )}
            {mode === 'sound' && <Row k="Road noise" v={`${(twin as any).sound?.outside_db ?? '—'} dB`} />}
            {((twin as any).suggestions ?? []).length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase text-amber-300"><Lightbulb className="h-3.5 w-3.5" />Suggestions</p>
                {((twin as any).suggestions as { kind: string; title: string; detail: string }[]).map((s) => (
                  <div key={s.title} className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-2.5 text-xs text-amber-100">
                    <span className="font-semibold">{s.title}.</span> <span className="text-amber-200/80">{s.detail}</span>
                  </div>
                ))}
              </div>
            )}
            <ul className="mt-3 space-y-2">
              {decisions.map((d) => (
                <li key={d.field} className="rounded-lg bg-slate-900/70 p-2.5 text-xs text-slate-300">
                  <span className="font-semibold text-white">{label(d.field)}:</span> {String(d.value)}
                  <span className="block text-slate-400">{d.reason}</span>
                </li>
              ))}
            </ul>
            {Object.entries(trads).map(([k, p]) => (
              <details key={k} className="rounded-lg bg-slate-900/70 p-2.5 text-xs text-slate-300">
                <summary className="cursor-pointer font-semibold text-white">{label(k)} ({p.mode}) · {Math.round((p.score + 1) * 50)}% aligned</summary>
                <ul className="mt-2 space-y-1">
                  {p.findings.map((f) => <li key={f.rule}><span className={f.status === 'violated' ? 'text-red-400' : f.status === 'satisfied' ? 'text-emerald-400' : 'text-slate-400'}>{f.status.replace('_', ' ')}</span> · {f.rule}</li>)}
                </ul>
                {!p.verified && <p className="mt-2 text-slate-500">Rules are a research draft, not yet reviewed by an expert.</p>}
              </details>
            ))}
            <p className="pt-1 text-xs text-slate-500 print:hidden">Click a room to see its numbers{canEdit ? ' or resize it' : ''}.</p>
          </div>
        )}

        {msg && <p role="status" className="mt-3 rounded-lg bg-slate-900 p-2 text-xs text-slate-200">{msg}</p>}

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-4 print:hidden">
          {canEdit && <button type="button" disabled={busy} onClick={() => edit('mirror')} className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs text-white hover:bg-slate-800"><FlipHorizontal className="h-3.5 w-3.5" />Mirror the plan</button>}
          <a href={dxfUrl(twin.house_id)} onClick={() => track('export', { format: 'dxf' })} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs text-white hover:bg-slate-800"><Download className="h-3.5 w-3.5" />DXF (CAD)</a>
          <button type="button" onClick={() => { track('export', { format: 'pdf' }); window.print(); }} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs text-white hover:bg-slate-800"><Printer className="h-3.5 w-3.5" />PDF / print</button>
          <a href={`https://wa.me/?text=${encodeURIComponent('My Nestora house concept: ' + (typeof window !== 'undefined' ? window.location.href.split('?')[0] : ''))}`} target="_blank" rel="noopener noreferrer"
            onClick={() => track('design_shared', { via: 'whatsapp' })} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs text-white hover:bg-slate-800"><Share2 className="h-3.5 w-3.5" />WhatsApp</a>
          <button type="button" onClick={share} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs text-white hover:bg-slate-800"><Copy className="h-3.5 w-3.5" />Copy link</button>
          <a href={`/house/${twin.house_id}/boq`} className="col-span-2 flex items-center justify-between rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500">
            <span>Cost estimate (3 finish levels)</span><ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </aside>
    </div>
  );
}

function Row({ k, v, swatch }: { k: string; v: string; swatch?: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-800/60 py-1 font-mono text-xs">
      <span className="text-slate-400">{k}</span>
      <span className="flex items-center gap-1.5 text-right text-white">{swatch && <span className="inline-block h-3 w-3 rounded-sm border border-slate-500" style={{ background: swatch }} />}{v}</span>
    </div>
  );
}
