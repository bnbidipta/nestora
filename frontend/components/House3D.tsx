'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The house in 3D as one building (walls with door and window openings, slabs, stair, roof parapet), not coloured blocks.
 * - Look around (orbit), walk inside (WASD / arrows + drag, joystick on phones), or take the guided tour room by room.
 * - Light: morning to sunset with real sun angles and shadows for the chosen season, then night with indoor lights.
 * - Interior style: switch between the styles the user picked (walls, floors, wood, accents); optional wall paint plan.
 * Built from the same room data as the 2D plan, so it always matches it.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ChevronLeft, ChevronRight, Footprints, Map as MapIcon, Move3d, Palette, Sofa, X } from 'lucide-react';
import { HouseTwin } from '@/lib/twin';
import { StyleEntry, getStyles } from '@/lib/api';
import { blockers, buildHouse, collides } from '@/lib/house3d';
import { roomName } from '@/lib/rooms';
import { area, lenShort, useLengthUnit } from '@/lib/units';

const FLOOR_COLOUR: Record<string, string> = {
  red_oxide: '#9B3B2A', kota_stone: '#8E9A8C', vitrified_tile: '#E8E4DC', vitrified: '#E8E4DC', marble: '#EEEDEA', italian_marble: '#EEEDEA',
  teak_wood: '#A06A3C', engineered_wood: '#B07E4F', wood: '#A06A3C', terracotta: '#B5653E', granite: '#6B6660', athangudi: '#C46A4A',
  cement_oxide: '#8C8479', anti_skid_tile: '#BDB7AC', ceramic_tile: '#D9D4CB',
};
const FURN_H: Record<string, number> = { bed: 1.8, 'double bed': 1.8, 'single bed': 1.8, sofa: 2.8, armchair: 2.8, wardrobe: 7, 'tv unit': 1.6, 'dining table': 2.5, desk: 2.5, 'study desk': 2.5, counter: 2.8, 'kitchen counter': 2.8, chair: 3 };
const ROAD_BEARING: Record<string, number> = { North: 0, East: 90, South: 180, West: 270 };
const ORDER = ['entrance', 'living', 'dining', 'kitchen', 'lounge', 'bedroom_master', 'bedroom', 'bedroom_elder', 'study', 'puja', 'toilet', 'balcony'];
const EYE = 5.3, SPEED = 7;
type Mode = 'orbit' | 'walk' | 'tour';
const md = (twin: HouseTwin) => (twin.metadata ?? {}) as Record<string, any>;

export default function House3D({ twin }: { twin: HouseTwin }) {
  const t = twin as any;
  const u = useLengthUnit();
  const mount = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('orbit');
  const [welcome, setWelcome] = useState(true);
  const [paint, setPaint] = useState(false);
  const [furniture, setFurniture] = useState(true);
  const [season, setSeason] = useState<'summer' | 'equinox' | 'winter'>('equinox');
  const sunPts: { hour: number; alt: number; az: number }[] = useMemo(() => t.climate?.sun_path?.[season] ?? [], [t, season]);
  const [timeIdx, setTimeIdx] = useState(4);  // index into sunPts; sunPts.length = night
  const night = sunPts.length > 0 && timeIdx >= sunPts.length;
  const floorsN = twin.floors.length;
  const [upTo, setUpTo] = useState(floorsN + 1);  // floors shown, cut away above; floorsN + 1 = whole house with roof
  const [walkFloor, setWalkFloor] = useState(0);
  const [styles, setStyles] = useState<StyleEntry[]>([]);
  const picked = useMemo(() => Array.from(new Set([twin.style?.primary_style, ...((md(twin).brief?.styles as string[] | undefined) ?? [])].filter(Boolean) as string[])), [twin]);
  const [styleId, setStyleId] = useState<string>(picked[0] ?? '');
  const joy = useRef({ x: 0, y: 0 });
  useEffect(() => { getStyles().then((r) => setStyles(r.styles)).catch(() => {}); }, []);
  const style = styles.find((s) => s.id === styleId);

  // the tour: every room, ground floor first, living spaces before service rooms
  const stops = useMemo(() => twin.floors.flatMap((f, fi) => f.rooms
    .filter((r) => !['passage', 'stair', 'lift', 'utility', 'porch'].includes(r.type ?? ''))
    .sort((a, b) => (ORDER.indexOf(a.type ?? '') + 99) % 99 - (ORDER.indexOf(b.type ?? '') + 99) % 99)
    .map((r) => ({ fi, floor: f.floor_no, room: r }))), [twin]);
  const [stop, setStop] = useState(0);
  const here = stops[Math.min(stop, stops.length - 1)];

  const W = Number(md(twin).envelope_width_ft ?? twin.plot.plot_width_ft), D = Number(md(twin).envelope_depth_ft ?? twin.plot.plot_depth_ft);
  const sbSide = Number(md(twin).setback_side_m ?? 0) * 3.28084, sbFront = Number(md(twin).setback_front_m ?? 0) * 3.28084;
  const house = useMemo(() => buildHouse(
    twin.floors.map((f) => ({ floor_no: f.floor_no, floor_height_ft: f.floor_height_ft, rooms: f.rooms as any })),
    (name) => t.furniture?.rooms?.[name]?.door_wall,
    { paint: paint ? Object.fromEntries(Object.entries(t.paint ?? {}).map(([k, v]: [string, any]) => [k, v.walls ?? []])) : undefined },
  ), [twin, paint, t]);

  const sun = useMemo(() => {
    const p = sunPts[Math.min(timeIdx, sunPts.length - 1)];
    if (!p || night) return { dir: new THREE.Vector3(0.3, 1, 0.2).normalize(), alt: 60 };
    const d = ((p.az - (ROAD_BEARING[twin.plot.orientation] ?? 90)) * Math.PI) / 180;
    const alt = (Math.max(3, p.alt) * Math.PI) / 180;
    return { dir: new THREE.Vector3(-Math.sin(d) * Math.cos(alt), Math.sin(alt), Math.cos(d) * Math.cos(alt)), alt: p.alt };
  }, [sunPts, timeIdx, night, twin.plot.orientation]);

  const levelOf = mode === 'tour' ? here?.fi ?? 0 : walkFloor;
  const tourCam = useRef<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight || 520;
    const cx = W / 2, cy = D / 2;
    const P = (x: number, y: number, z: number) => new THREE.Vector3(x - cx, z, cy - y);  // plan -> scene
    const inside = mode !== 'orbit';
    const low = sun.alt < 15;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(night ? 0x111a2c : low ? 0xf2c9a0 : inside ? 0xdfe8ef : 0xf3f1ec);
    const camera = new THREE.PerspectiveCamera(inside ? 70 : 40, w / h, 0.1, 3000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = !night;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    const disposables: { dispose: () => void }[] = [];
    const mats = new Map<string, THREE.MeshStandardMaterial>();
    const mat = (c: string, rough = 0.9) => {
      const k = c + rough;
      if (!mats.has(k)) { const m = new THREE.MeshStandardMaterial({ color: c, roughness: rough }); mats.set(k, m); disposables.push(m); }
      return mats.get(k)!;
    };

    scene.add(new THREE.HemisphereLight(night ? 0x3a4a6a : 0xffffff, 0x9a958a, night ? 0.25 : 0.9),
      new THREE.AmbientLight(0xffffff, night ? 0.08 : inside ? 0.7 : 0.3));
    const R = Math.max(W, D) * 1.5;
    if (!night) {
      const s = new THREE.DirectionalLight(low ? 0xffb27a : 0xfff4e0, low ? 1.2 : 1.6);
      s.position.copy(sun.dir.clone().multiplyScalar(R));
      s.castShadow = true;
      s.shadow.mapSize.set(2048, 2048);
      Object.assign(s.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: R * 3 });
      scene.add(s);
    }

    // site
    const PW = twin.plot.plot_width_ft, PD = twin.plot.plot_depth_ft;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), mat(night ? '#2E3A2A' : '#C9D6B0'));
    ground.rotation.x = -Math.PI / 2;
    ground.position.copy(P(-sbSide + PW / 2, -sbFront + PD / 2, -0.5));
    ground.receiveShadow = true;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(PW + 40, 24), mat('#6B6F75'));
    road.rotation.x = -Math.PI / 2;
    road.position.copy(P(-sbSide + PW / 2, -sbFront - 12, -0.52));
    disposables.push(ground.geometry, road.geometry);
    scene.add(ground, road);

    // building, coloured by the chosen interior style
    const pal = style?.palette;
    const levels = house.levels;
    const lvl = levels[levelOf] ?? levels[0];
    const topShown = inside ? (lvl?.base ?? 0) + (lvl?.height ?? 10) - 0.5
      : upTo > floorsN ? Infinity : (levels[upTo - 1]?.base ?? 0) + (levels[upTo - 1]?.height ?? 0) - 0.5;
    const wallM = mat(pal?.wall ?? '#F1EDE4'), slabM = mat('#CFCAC0'), stepM = mat('#B9B3A8');
    for (const b of house.boxes) {
      if (b.z0 >= topShown) continue;
      const g = new THREE.BoxGeometry(b.x1 - b.x0, b.z1 - b.z0, b.y1 - b.y0);
      disposables.push(g);
      const mesh = new THREE.Mesh(g, b.kind === 'slab' ? slabM : b.kind === 'step' ? stepM : b.kind === 'lining' ? mat(b.colour!) : wallM);
      mesh.position.copy(P((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2));
      mesh.castShadow = !night; mesh.receiveShadow = true;
      scene.add(mesh);
    }
    for (const lv of levels) {
      if (lv.base >= topShown) continue;
      const f = twin.floors.find((x) => x.floor_no === lv.floor);
      for (const r of f?.rooms ?? []) {
        const g = new THREE.PlaneGeometry(r.length_ft, r.width_ft);
        disposables.push(g);
        const wet = ['toilet', 'utility', 'laundry', 'kitchen'].includes(r.type ?? '');
        const m = new THREE.Mesh(g, mat(pal && !wet ? pal.floor : FLOOR_COLOUR[r.material_floor] ?? '#D9D2C3'));
        m.rotation.x = -Math.PI / 2;
        m.position.copy(P(r.x + r.length_ft / 2, r.y + r.width_ft / 2, lv.base + 0.02));
        m.receiveShadow = true;
        scene.add(m);
        if (night && !['porch', 'balcony'].includes(r.type ?? '')) {  // a warm ceiling light in every room
          const l = new THREE.PointLight(0xffd59a, 14, Math.max(r.length_ft, r.width_ft) * 1.6, 1.6);
          l.position.copy(P(r.x + r.length_ft / 2, r.y + r.width_ft / 2, lv.base + lv.height - 1.2));
          scene.add(l);
        }
      }
      if (furniture) {
        for (const fr of Object.values(t.furniture?.rooms ?? {}) as any[]) {
          if ((fr.floor ?? 0) !== lv.floor) continue;
          for (const it of fr.items ?? []) {
            const hgt = FURN_H[it.item] ?? 2.5;
            const g = new THREE.BoxGeometry(it.w, hgt, it.d);
            disposables.push(g);
            const soft = /bed|sofa|armchair/.test(it.item);
            const m = new THREE.Mesh(g, mat(soft ? (pal?.accent ?? '#E9E1D3') : (pal?.wood ?? '#8A6A4A'), soft ? 0.95 : 0.6));
            m.position.copy(P(it.x + it.w / 2, it.y + it.d / 2, lv.base + hgt / 2));
            m.castShadow = !night;
            scene.add(m);
          }
        }
      }
    }

    // controls
    let raf = 0, last = performance.now(), visibleTab = true;
    const wallsHere = blockers(house.boxes, lvl?.base ?? 0);
    const keys = new Set<string>();
    let yaw = Math.PI, pitch = 0;
    let orbit: OrbitControls | null = null;
    const start = twin.floors[walkFloor]?.rooms.find((r) => ['living', 'entrance', 'lounge'].includes(r.type ?? '')) ?? twin.floors[walkFloor]?.rooms[0];
    const me = { x: start ? start.x + start.length_ft / 2 : W / 2, y: start ? start.y + start.width_ft / 2 : D / 2 };
    if (mode === 'orbit') {
      orbit = new OrbitControls(camera, renderer.domElement);
      orbit.enableDamping = true;
      orbit.maxPolarAngle = Math.PI / 2.05;
      orbit.target.set(0, (levels[Math.min(upTo, floorsN) - 1]?.base ?? 0) / 2 + 5, 0);
      camera.position.set(R * 0.75, R * 0.65, R * 0.9);
    }
    // tour: stand in the room's front-left corner, look across to the far corner; glide from the previous stop
    let target: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;
    const lookNow = new THREE.Vector3();
    if (mode === 'tour' && here) {
      const r = here.room, base = levels[here.fi]?.base ?? 0;
      target = { pos: P(r.x + Math.min(1.4, r.length_ft / 4), r.y + Math.min(1.4, r.width_ft / 4), base + EYE),
        look: P(r.x + r.length_ft * 0.75, r.y + r.width_ft * 0.75, base + 3.6) };
      const from = tourCam.current ?? target;
      camera.position.copy(from.pos);
      lookNow.copy(from.look);
      camera.lookAt(lookNow);
    }
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { if (e.type === 'keydown') keys.add(k); else keys.delete(k); e.preventDefault(); }
    };
    let dragging: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => { dragging = { x: e.clientX, y: e.clientY }; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      yaw -= (e.clientX - dragging.x) * 0.005; pitch = Math.max(-1.2, Math.min(1.2, pitch - (e.clientY - dragging.y) * 0.004));
      dragging = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { dragging = null; };
    if (mode === 'walk') {
      window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
      renderer.domElement.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    }
    const io = new IntersectionObserver(([e]) => { visibleTab = e.isIntersecting; });
    io.observe(el);
    const onResize = () => { const ww = el.clientWidth, hh = el.clientHeight || 520; camera.aspect = ww / hh; camera.updateProjectionMatrix(); renderer.setSize(ww, hh); };
    window.addEventListener('resize', onResize);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visibleTab) return;
      if (mode === 'walk') {
        if (keys.has('arrowleft')) yaw += 1.8 * dt;
        if (keys.has('arrowright')) yaw -= 1.8 * dt;
        const fwd = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - joy.current.y;
        const side = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0) + joy.current.x;
        const vx = (-Math.sin(yaw) * fwd + Math.cos(yaw) * side) * SPEED * dt;
        const vz = (-Math.cos(yaw) * fwd - Math.sin(yaw) * side) * SPEED * dt;
        const nx = me.x + vx, ny = me.y - vz;
        if (!collides(wallsHere, nx, me.y)) me.x = nx;
        if (!collides(wallsHere, me.x, ny)) me.y = ny;
        camera.position.copy(P(me.x, me.y, (lvl?.base ?? 0) + EYE));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
      } else if (target) {
        camera.position.lerp(target.pos, 0.06);
        lookNow.lerp(target.look, 0.06);
        camera.lookAt(lookNow);
      } else orbit?.update();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); orbit?.dispose();
      tourCam.current = mode === 'tour' ? { pos: camera.position.clone(), look: lookNow.clone() } : null;
      window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
      disposables.forEach((d) => d.dispose()); renderer.dispose(); el.removeChild(renderer.domElement);
    };
  }, [house, mode, walkFloor, upTo, furniture, sun, night, W, D, sbSide, sbFront, twin, t, floorsN, style, here, levelOf]);

  const go = (m: Mode) => { setWelcome(false); if (m === 'tour') setStop(0); setMode(m); };
  const btn = (on: boolean) => `flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs ${on ? 'bg-white text-slate-900' : 'border border-slate-700 text-slate-300 hover:text-white'}`;
  const p = sunPts[Math.min(timeIdx, sunPts.length - 1)];
  const timeLabel = night ? 'Night' : p ? `${String(Math.floor(p.hour)).padStart(2, '0')}:${p.hour % 1 ? '30' : '00'}${p.alt < 15 ? (p.hour < 12 ? ' · morning' : ' · sunset') : ''}` : '';
  const features = (r: any): string[] => {
    const f = t.furniture?.rooms?.[r.name];
    const c = t.climate?.rooms?.[r.name];
    return [
      r.exterior && r.compass ? `Windows face ${r.compass}` : 'Inner room, aired by a vent',
      r.material_floor ? `${String(r.material_floor).replace(/_/g, ' ')} floor` : '',
      f?.items?.length ? `Fits ${f.items.map((i: any) => i.item).join(', ')}` : '',
      c?.rating ? `${c.rating[0].toUpperCase()}${c.rating.slice(1)} on summer afternoons` : '',
    ].filter(Boolean);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <button type="button" onClick={() => go('orbit')} aria-pressed={mode === 'orbit'} className={btn(mode === 'orbit')}><Move3d className="h-3.5 w-3.5" />Look around</button>
        <button type="button" onClick={() => go('walk')} aria-pressed={mode === 'walk'} className={btn(mode === 'walk')}><Footprints className="h-3.5 w-3.5" />Walk inside</button>
        <button type="button" onClick={() => go('tour')} aria-pressed={mode === 'tour'} className={btn(mode === 'tour')}><MapIcon className="h-3.5 w-3.5" />Guided tour</button>
        <span className="mx-1 h-5 w-px bg-slate-700" />
        <button type="button" onClick={() => setFurniture((v) => !v)} aria-pressed={furniture} className={btn(furniture)}><Sofa className="h-3.5 w-3.5" />Furniture</button>
        <button type="button" onClick={() => setPaint((v) => !v)} aria-pressed={paint} className={btn(paint)}><Palette className="h-3.5 w-3.5" />Paint plan</button>
        {styles.length > 0 && picked.length > 0 && (
          <label className="flex items-center gap-1.5 font-mono text-xs text-slate-300">Interior style
            <select value={styleId} onChange={(e) => setStyleId(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100">
              {picked.map((id) => <option key={id} value={id}>{styles.find((s) => s.id === id)?.name ?? id}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 pb-3 font-mono text-xs text-slate-300">
        {mode === 'walk' && twin.floors.map((f, i) => (
          <button key={f.floor_no} type="button" onClick={() => setWalkFloor(i)} aria-pressed={walkFloor === i} className={btn(walkFloor === i)}>{f.floor_no === 0 ? 'Ground' : `Floor ${f.floor_no}`}</button>
        ))}
        {mode === 'orbit' && [...twin.floors.map((f, i) => ({ n: i + 1, text: i === 0 ? 'Ground floor' : `Up to floor ${f.floor_no}` })), { n: floorsN + 1, text: 'Whole house' }].map(({ n, text }) => (
          <button key={n} type="button" onClick={() => setUpTo(n)} aria-pressed={upTo === n} className={btn(upTo === n)}>{text}</button>
        ))}
        {sunPts.length > 0 && (
          <>
            <span className="mx-1 h-5 w-px bg-slate-700" />
            {(['summer', 'equinox', 'winter'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSeason(s)} aria-pressed={season === s} className={btn(season === s)}>{{ summer: 'June', equinox: 'Mar / Sep', winter: 'December' }[s]}</button>
            ))}
            <label className="flex items-center gap-2">Light
              <input type="range" min={0} max={sunPts.length} value={Math.min(timeIdx, sunPts.length)} onChange={(e) => setTimeIdx(Number(e.target.value))} className="w-44 accent-amber-400" aria-label="Time of day" />
              <span className="w-28">{timeLabel}</span>
            </label>
          </>
        )}
      </div>
      <div className="relative">
        <div ref={mount} className={`h-[520px] w-full overflow-hidden rounded-xl ${mode === 'walk' ? 'cursor-grab' : mode === 'orbit' ? 'cursor-move' : ''}`}
          aria-label={mode === 'walk' ? 'Walk-through: W A S D or arrow keys to move, drag to look' : mode === 'tour' ? 'Guided tour' : '3D model: drag to rotate, scroll to zoom'} />
        {welcome && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/55 p-4">
            <div className="max-w-sm rounded-2xl bg-ivory-50 p-6 text-center text-slate-900 shadow-2xl">
              <h3 className="text-xl font-bold">Welcome to your home</h3>
              <p className="mt-1 text-sm text-slate-600">{floorsN === 1 ? 'Single storey' : `${floorsN} floors`} · {stops.length} rooms · {area(twin.floors.reduce((s, f) => s + f.rooms.reduce((a, r) => a + r.area_sqft, 0), 0), u)}</p>
              <div className="mt-5 grid gap-2">
                <button type="button" onClick={() => go('tour')} className="rounded-lg bg-sage-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sage-900">Take the guided tour</button>
                <button type="button" onClick={() => go('walk')} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Walk around on my own</button>
                <button type="button" onClick={() => go('orbit')} className="rounded-lg px-4 py-2 text-sm text-slate-600 underline">Just look at the outside</button>
              </div>
            </div>
          </div>
        )}
        {mode === 'walk' && !welcome && (
          <>
            <p className="pointer-events-none absolute left-3 top-3 rounded bg-black/55 px-2 py-1 font-mono text-[11px] text-white">W A S D / arrows to walk · drag to look</p>
            <Joystick onMove={(x, y) => { joy.current = { x, y }; }} />
          </>
        )}
        {mode === 'tour' && here && !welcome && (
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
            <div className="max-w-md rounded-xl bg-black/65 p-3 text-white backdrop-blur">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">{here.floor === 0 ? 'Ground floor' : `Floor ${here.floor}`} · {stop + 1} of {stops.length}</p>
              <p className="text-lg font-bold">{roomName(here.room.name, here.room.type ?? undefined)}</p>
              <p className="text-sm text-white/80">{lenShort(here.room.length_ft, u)} × {lenShort(here.room.width_ft, u)} · {area(here.room.area_sqft, u)}</p>
              <ul className="mt-1 list-disc pl-4 text-xs text-white/75">{features(here.room).map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
            <div className="flex gap-2">
              <button type="button" aria-label="Previous room" disabled={stop === 0} onClick={() => setStop((s) => Math.max(0, s - 1))} className="rounded-full bg-white/90 p-2.5 text-slate-900 disabled:opacity-40"><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" aria-label="Next room" disabled={stop >= stops.length - 1} onClick={() => setStop((s) => Math.min(stops.length - 1, s + 1))} className="rounded-full bg-white/90 p-2.5 text-slate-900 disabled:opacity-40"><ChevronRight className="h-5 w-5" /></button>
              <button type="button" aria-label="End tour" onClick={() => go('orbit')} className="rounded-full bg-white/90 p-2.5 text-slate-900"><X className="h-5 w-5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** On-screen stick for phones: drag inside the circle; x/y in -1..1. */
function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const update = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    setKnob({ x, y }); onMove(x, y);
  };
  const end = () => { setKnob({ x: 0, y: 0 }); onMove(0, 0); };
  return (
    <div ref={ref} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); update(e); }} onPointerMove={(e) => e.buttons && update(e)} onPointerUp={end} onPointerCancel={end}
      className="absolute bottom-4 left-4 h-28 w-28 touch-none rounded-full border-2 border-white/60 bg-black/25 md:hidden" aria-label="Move">
      <div className="absolute h-10 w-10 rounded-full bg-white/80" style={{ left: `calc(50% - 20px + ${knob.x * 36}px)`, top: `calc(50% - 20px + ${knob.y * 36}px)` }} />
    </div>
  );
}
