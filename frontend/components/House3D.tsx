'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The house in 3D as one building (walls with door and window openings, slabs, stair, roof parapet), not coloured blocks.
 * Orbit to look around, or walk through it at eye height (WASD / arrows + mouse on desktop, joystick + drag on phones).
 * Overlays: sun and shadows at a chosen season and hour, furniture, and wall paint.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Footprints, Move3d, Palette, Sofa, Sun } from 'lucide-react';
import { HouseTwin } from '@/lib/twin';
import { Box, blockers, buildHouse, collides } from '@/lib/house3d';

const FLOOR_COLOUR: Record<string, string> = {
  red_oxide: '#9B3B2A', kota_stone: '#8E9A8C', vitrified_tile: '#E8E4DC', vitrified: '#E8E4DC', marble: '#EEEDEA', italian_marble: '#EEEDEA',
  teak_wood: '#A06A3C', engineered_wood: '#B07E4F', wood: '#A06A3C', terracotta: '#B5653E', granite: '#6B6660', athangudi: '#C46A4A',
  cement_oxide: '#8C8479', anti_skid_tile: '#BDB7AC', ceramic_tile: '#D9D4CB',
};
const FURN_H: Record<string, number> = { bed: 1.8, 'double bed': 1.8, 'single bed': 1.8, sofa: 2.8, armchair: 2.8, wardrobe: 7, 'tv unit': 1.6, 'dining table': 2.5, desk: 2.5, 'study desk': 2.5, counter: 2.8, 'kitchen counter': 2.8, chair: 3 };
const ROAD_BEARING: Record<string, number> = { North: 0, East: 90, South: 180, West: 270 };
const EYE = 5.3, SPEED = 7;

export default function House3D({ twin }: { twin: HouseTwin }) {
  const t = twin as any;
  const mount = useRef<HTMLDivElement>(null);
  const [walk, setWalk] = useState(false);
  const [paint, setPaint] = useState(false);
  const [furniture, setFurniture] = useState(true);
  const [sunOn, setSunOn] = useState(true);
  const [season, setSeason] = useState<'summer' | 'equinox' | 'winter'>('equinox');
  const sunPts: { hour: number; alt: number; az: number }[] = t.climate?.sun_path?.[season] ?? [];
  const [hourIdx, setHourIdx] = useState(4);
  const floorsN = twin.floors.length;
  const [upTo, setUpTo] = useState(floorsN + 1);  // floors shown, cut away above; floorsN + 1 = whole house with roof
  const [walkFloor, setWalkFloor] = useState(0);
  const joy = useRef({ x: 0, y: 0 });

  const md = twin.metadata ?? {};
  const W = Number(md.envelope_width_ft ?? twin.plot.plot_width_ft), D = Number(md.envelope_depth_ft ?? twin.plot.plot_depth_ft);
  const sbSide = Number(md.setback_side_m ?? 0) * 3.28084, sbFront = Number(md.setback_front_m ?? 0) * 3.28084;
  const house = useMemo(() => buildHouse(
    twin.floors.map((f) => ({ floor_no: f.floor_no, floor_height_ft: f.floor_height_ft, rooms: f.rooms as any })),
    (name) => t.furniture?.rooms?.[name]?.door_wall,
    { paint: paint ? Object.fromEntries(Object.entries(t.paint ?? {}).map(([k, v]: [string, any]) => [k, v.walls ?? []])) : undefined },
  ), [twin, paint]);  // eslint-disable-line react-hooks/exhaustive-deps

  const sunDir = useMemo(() => {
    const p = sunPts[Math.min(hourIdx, sunPts.length - 1)];
    if (!p) return new THREE.Vector3(0.4, 1, 0.3).normalize();
    const d = ((p.az - (ROAD_BEARING[twin.plot.orientation] ?? 90)) * Math.PI) / 180;
    const alt = (Math.max(3, p.alt) * Math.PI) / 180;
    return new THREE.Vector3(-Math.sin(d) * Math.cos(alt), Math.sin(alt), Math.cos(d) * Math.cos(alt));
  }, [sunPts, hourIdx, twin.plot.orientation]);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight || 520;
    const cx = W / 2, cy = D / 2;
    const P = (x: number, y: number, z: number) => new THREE.Vector3(x - cx, z, cy - y);  // plan -> scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(walk ? 0xdfe8ef : 0xf3f1ec);
    const camera = new THREE.PerspectiveCamera(walk ? 70 : 40, w / h, 0.1, 3000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = sunOn;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    const disposables: { dispose: () => void }[] = [];
    const mat = (c: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, ...extra }); disposables.push(m); return m; };

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a958a, sunOn ? 0.9 : 1.3), new THREE.AmbientLight(0xffffff, walk ? 0.75 : 0.3));
    const sun = new THREE.DirectionalLight(0xfff4e0, sunOn ? 1.6 : 0.5);
    const R = Math.max(W, D) * 1.5;
    sun.position.copy(sunDir.clone().multiplyScalar(R));
    sun.castShadow = sunOn;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: R * 3 });
    scene.add(sun);

    // site: plot, envelope, road
    const PW = twin.plot.plot_width_ft, PD = twin.plot.plot_depth_ft;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), mat('#C9D6B0'));
    ground.rotation.x = -Math.PI / 2;
    ground.position.copy(P(-sbSide + PW / 2, -sbFront + PD / 2, -0.5));
    ground.receiveShadow = true;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(PW + 40, 24), mat('#6B6F75'));
    road.rotation.x = -Math.PI / 2;
    road.position.copy(P(-sbSide + PW / 2, -sbFront - 12, -0.52));
    disposables.push(ground.geometry, road.geometry);
    scene.add(ground, road);

    // building
    const levels = house.levels;
    const topShown = upTo > floorsN ? Infinity : (levels[upTo - 1]?.base ?? 0) + (levels[upTo - 1]?.height ?? 0) - 0.5;
    const visible = (b: Box) => (walk ? b.z0 < (levels[walkFloor]?.base ?? 0) + (levels[walkFloor]?.height ?? 10) - 0.5 : b.z0 < topShown);
    const wallM = mat('#F1EDE4'), slabM = mat('#CFCAC0'), stepM = mat('#B9B3A8');
    const linM = new Map<string, THREE.Material>();
    for (const b of house.boxes) {
      if (!visible(b)) continue;
      const g = new THREE.BoxGeometry(b.x1 - b.x0, b.z1 - b.z0, b.y1 - b.y0);
      disposables.push(g);
      const m = b.kind === 'slab' ? slabM : b.kind === 'step' ? stepM : b.kind === 'lining'
        ? (linM.get(b.colour!) ?? (linM.set(b.colour!, mat(b.colour!)), linM.get(b.colour!)!)) : wallM;
      const mesh = new THREE.Mesh(g, m);
      mesh.position.copy(P((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2));
      mesh.castShadow = sunOn; mesh.receiveShadow = true;
      scene.add(mesh);
    }
    // floor finishes, furniture
    for (const lv of levels) {
      if (walk ? lv.floor > walkFloor : lv.base >= topShown) continue;
      const f = twin.floors.find((x) => x.floor_no === lv.floor);
      for (const r of f?.rooms ?? []) {
        const g = new THREE.PlaneGeometry(r.length_ft, r.width_ft);
        disposables.push(g);
        const m = new THREE.Mesh(g, mat(FLOOR_COLOUR[r.material_floor] ?? '#D9D2C3'));
        m.rotation.x = -Math.PI / 2;
        m.position.copy(P(r.x + r.length_ft / 2, r.y + r.width_ft / 2, lv.base + 0.02));
        m.receiveShadow = true;
        scene.add(m);
      }
      if (furniture) {
        for (const [, fr] of Object.entries(t.furniture?.rooms ?? {}) as [string, any][]) {
          if ((fr.floor ?? 0) !== lv.floor) continue;
          for (const it of fr.items ?? []) {
            const hgt = FURN_H[it.item] ?? 2.5;
            const g = new THREE.BoxGeometry(it.w, hgt, it.d);
            disposables.push(g);
            const m = new THREE.Mesh(g, mat(it.item.includes('bed') ? '#E9E1D3' : it.item === 'wardrobe' ? '#8A6A4A' : '#B08A62', { roughness: 0.7 }));
            m.position.copy(P(it.x + it.w / 2, it.y + it.d / 2, lv.base + hgt / 2));
            m.castShadow = sunOn;
            scene.add(m);
          }
        }
      }
    }

    // cameras / controls
    let raf = 0, last = performance.now(), visibleTab = true;
    const lv = levels[walkFloor] ?? levels[0];
    const wallsHere = blockers(house.boxes, lv?.base ?? 0);
    const keys = new Set<string>();
    let yaw = 0, pitch = 0;
    let orbit: OrbitControls | null = null;
    // walker position in plan feet
    const start = twin.floors[walkFloor]?.rooms.find((r) => ['living', 'entrance', 'lounge'].includes(r.type ?? '')) ?? twin.floors[walkFloor]?.rooms[0];
    const me = { x: start ? start.x + start.length_ft / 2 : W / 2, y: start ? start.y + start.width_ft / 2 : D / 2 };
    if (walk) {
      yaw = Math.PI;  // face away from the road, into the house
    } else {
      orbit = new OrbitControls(camera, renderer.domElement);
      orbit.enableDamping = true;
      orbit.maxPolarAngle = Math.PI / 2.05;
      orbit.target.set(0, (levels[Math.min(upTo, floorsN) - 1]?.base ?? 0) / 2 + 5, 0);
      camera.position.set(R * 0.75, R * 0.65, R * 0.9);
    }
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { e.type === 'keydown' ? keys.add(k) : keys.delete(k); e.preventDefault(); }
    };
    let dragging: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => { if (walk) { dragging = { x: e.clientX, y: e.clientY }; el.setPointerCapture?.(e.pointerId); } };
    const onMove = (e: PointerEvent) => {
      if (!walk || !dragging) return;
      yaw -= (e.clientX - dragging.x) * 0.005; pitch = Math.max(-1.2, Math.min(1.2, pitch - (e.clientY - dragging.y) * 0.004));
      dragging = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { dragging = null; };
    if (walk) {
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
      if (walk) {
        if (keys.has('arrowleft')) yaw += 1.8 * dt;
        if (keys.has('arrowright')) yaw -= 1.8 * dt;
        const fwd = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) + -joy.current.y;
        const side = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0) + joy.current.x;
        // forward in scene is (-sin yaw, -cos yaw); scene z = cy - plan y
        const vx = (-Math.sin(yaw) * fwd + Math.cos(yaw) * side) * SPEED * dt;
        const vz = (-Math.cos(yaw) * fwd - Math.sin(yaw) * side) * SPEED * dt;
        const nx = me.x + vx, ny = me.y - vz;
        if (!collides(wallsHere, nx, me.y)) me.x = nx;
        if (!collides(wallsHere, me.x, ny)) me.y = ny;
        camera.position.copy(P(me.x, me.y, (lv?.base ?? 0) + EYE));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
      } else orbit?.update();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); orbit?.dispose();
      window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
      disposables.forEach((d) => d.dispose()); renderer.dispose(); el.removeChild(renderer.domElement);
    };
  }, [house, walk, walkFloor, upTo, furniture, sunOn, sunDir, W, D, sbSide, sbFront, twin, floorsN]);  // eslint-disable-line react-hooks/exhaustive-deps

  const btn = (on: boolean) => `flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs ${on ? 'bg-white text-slate-900' : 'border border-slate-700 text-slate-300 hover:text-white'}`;
  const p = sunPts[Math.min(hourIdx, sunPts.length - 1)];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <button type="button" onClick={() => setWalk(false)} aria-pressed={!walk} className={btn(!walk)}><Move3d className="h-3.5 w-3.5" />Look around</button>
        <button type="button" onClick={() => setWalk(true)} aria-pressed={walk} className={btn(walk)}><Footprints className="h-3.5 w-3.5" />Walk inside</button>
        <span className="mx-1 h-5 w-px bg-slate-700" />
        <button type="button" onClick={() => setSunOn((v) => !v)} aria-pressed={sunOn} className={btn(sunOn)}><Sun className="h-3.5 w-3.5" />Sun</button>
        <button type="button" onClick={() => setFurniture((v) => !v)} aria-pressed={furniture} className={btn(furniture)}><Sofa className="h-3.5 w-3.5" />Furniture</button>
        <button type="button" onClick={() => setPaint((v) => !v)} aria-pressed={paint} className={btn(paint)}><Palette className="h-3.5 w-3.5" />Paint</button>
        <span className="mx-1 h-5 w-px bg-slate-700" />
        {walk ? twin.floors.map((f, i) => (
          <button key={f.floor_no} type="button" onClick={() => setWalkFloor(i)} aria-pressed={walkFloor === i} className={btn(walkFloor === i)}>{f.floor_no === 0 ? 'Ground' : `Floor ${f.floor_no}`}</button>
        )) : [...twin.floors.map((f, i) => ({ n: i + 1, text: i === 0 ? 'Ground floor' : `Up to floor ${f.floor_no}` })), { n: floorsN + 1, text: 'Whole house' }].map(({ n, text }) => (
          <button key={n} type="button" onClick={() => setUpTo(n)} aria-pressed={upTo === n} className={btn(upTo === n)}>{text}</button>
          ))}
      </div>
      {sunOn && sunPts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pb-3 font-mono text-xs text-slate-300">
          {(['summer', 'equinox', 'winter'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setSeason(s)} aria-pressed={season === s} className={btn(season === s)}>{{ summer: 'June', equinox: 'March / Sept', winter: 'December' }[s]}</button>
          ))}
          <label className="flex items-center gap-2">Time
            <input type="range" min={0} max={sunPts.length - 1} value={Math.min(hourIdx, sunPts.length - 1)} onChange={(e) => setHourIdx(Number(e.target.value))} className="w-40 accent-amber-400" />
            <span>{p ? `${String(Math.floor(p.hour)).padStart(2, '0')}:${p.hour % 1 ? '30' : '00'}` : ''}</span>
          </label>
        </div>
      )}
      <div className="relative">
        <div ref={mount} className={`h-[520px] w-full overflow-hidden rounded-xl ${walk ? 'cursor-grab' : 'cursor-move'}`} aria-label={walk ? 'Walk-through: W A S D or arrow keys to move, drag to look' : '3D model: drag to rotate, scroll to zoom'} />
        {walk && (
          <>
            <p className="pointer-events-none absolute left-3 top-3 rounded bg-black/55 px-2 py-1 font-mono text-[11px] text-white">W A S D / arrows to walk · drag to look</p>
            <Joystick onMove={(x, y) => { joy.current = { x, y }; }} />
          </>
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
