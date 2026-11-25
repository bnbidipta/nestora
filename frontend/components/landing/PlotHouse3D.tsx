'use client';

/**
 * A small house on a plot of the visitor's size, built with the app's own geometry (lib/house3d) and drawn up to
 * `progress` (0 = empty plot, 1 = finished with roof terrace), so it can grow over time or with scrolling.
 * Renders on demand; slowly turns while visible.
 */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Look, buildHouse } from '@/lib/house3d';
import { addHouse, materials } from '@/lib/houseScene';

const LOOK: Look = {
  archetype: 'terrace',
  roof: { form: 'flat', pitch_deg: 0, eave_m: 0, tile: '#A0522D', cover: 0 },
  terrace: { usable: true, parapet_m: 1.05, pergola: true, garden: true, tank: true, mumty: true, pavilion: 0 },
  shading: { chhajja_m: 0.6, jaali: true, fins: false },
  facade: { plinth_m: 0.45, wall: '#F2EDE4', accent: '#B4532A', wood: '#7A4E2D', rail: 'glass', band: true },
};

/** A plausible house for a plot (feet): setbacks, car porch if wanted, upper floors with a front terrace. */
function rooms(W: number, D: number, floors: number, car: boolean) {
  const w = Math.max(14, W - 6), d = Math.max(18, D - 14), x0 = 3, y0 = 9;
  const cw = w / 2, rd = d / 3;
  const stair = (n: number) => ({ name: `stair${n}`, type: 'stair', x: x0 + cw, y: y0 + rd, length_ft: Math.min(7, cw), width_ft: rd });
  const out = [{ floor_no: 0, floor_height_ft: 10, rooms: [
    { name: 'living', type: 'living', x: x0, y: y0, length_ft: car ? cw : w, width_ft: rd },
    ...(car ? [{ name: 'porch', type: 'porch', x: x0 + cw, y: y0, length_ft: cw, width_ft: rd }] : []),
    { name: 'dining', type: 'dining', x: x0, y: y0 + rd, length_ft: cw, width_ft: rd },
    ...(floors > 1 ? [stair(0)] : [{ name: 'bed0', type: 'bedroom', x: x0 + cw, y: y0 + rd, length_ft: cw, width_ft: rd }]),
    { name: 'kitchen', type: 'kitchen', x: x0, y: y0 + 2 * rd, length_ft: cw, width_ft: rd },
    { name: 'bedroom_elder', type: 'bedroom', x: x0 + cw, y: y0 + 2 * rd, length_ft: cw, width_ft: rd },
  ] }];
  for (let f = 1; f < floors; f++) {
    const top = f === floors - 1;  // the top floor steps back: its front becomes a terrace
    out.push({ floor_no: f, floor_height_ft: 10, rooms: [
      stair(f),
      ...(top ? [] : [{ name: `front${f}`, type: 'bedroom', x: x0, y: y0, length_ft: w, width_ft: rd }]),
      { name: `lounge${f}`, type: 'lounge', x: x0, y: y0 + rd, length_ft: cw, width_ft: rd },
      { name: `bed${f}a`, type: 'bedroom', x: x0, y: y0 + 2 * rd, length_ft: cw, width_ft: rd },
      { name: `bed${f}b`, type: 'bedroom', x: x0 + cw, y: y0 + 2 * rd, length_ft: cw, width_ft: rd },
    ] });
  }
  return out;
}

export default function PlotHouse3D({ plotW, plotD, progress, floors = 2, car = true, className = '' }: { plotW: number; plotD: number; progress: number; floors?: number; car?: boolean; className?: string }) {
  const mount = useRef<HTMLDivElement>(null);
  const prog = useRef(progress);
  const house = useMemo(() => buildHouse(rooms(plotW, plotD, Math.max(1, Math.min(5, floors)), car) as never, () => undefined, { look: LOOK }), [plotW, plotD, floors, car]);
  const draw = useRef<(() => void) | null>(null);

  useEffect(() => { prog.current = progress; draw.current?.(); }, [progress]);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.NeutralToneMapping;
    el.appendChild(renderer.domElement);
    const cx = plotW / 2, cy = plotD / 2;
    const P = (x: number, y: number, z: number) => new THREE.Vector3(x - cx, z, cy - y);
    const R = Math.max(plotW, plotD, house.roofTop * 1.2) * 2.3;
    const camera = new THREE.PerspectiveCamera(32, w / h, 1, R * 10);
    const mats = materials(LOOK, undefined);
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
    sun.position.set(R * 0.6, R, R * 0.8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: R * 4 });
    const soil = new THREE.Mesh(new THREE.PlaneGeometry(plotW, plotD), new THREE.MeshStandardMaterial({ color: '#B5653E', roughness: 1 }));
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = -0.52;
    soil.receiveShadow = true;
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(R * 12, R * 12), new THREE.MeshStandardMaterial({ color: '#C7D3AE', roughness: 1 }));
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.y = -0.56;
    let angle = 0.7, raf = 0, visible = true, geos: THREE.BufferGeometry[] = [];
    const scene = new THREE.Scene();

    const frame = () => {
      scene.clear();
      geos.forEach((g) => g.dispose());
      scene.add(new THREE.HemisphereLight(0xffffff, 0xb9ad98, 1.1), sun, lawn, soil);
      const p = prog.current;
      // 0..0.15 empty plot; then the house rises layer by layer; the roof terrace completes at 1
      const top = p >= 0.999 ? Infinity : p < 0.15 ? -1 : ((p - 0.15) / 0.85) * house.roofTop;
      geos = addHouse(scene, house, P, mats.byKind, { topShown: top });
      camera.position.set(Math.sin(angle) * R, R * 0.55, Math.cos(angle) * R);
      camera.lookAt(0, house.roofTop * 0.4, 0);
      renderer.render(scene, camera);
    };
    draw.current = frame;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      angle += 0.0018;
      frame();
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      geos.forEach((g) => g.dispose());
      mats.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      draw.current = null;
    };
  }, [house, plotW, plotD]);

  return <div ref={mount} className={className} aria-label={`A house on a ${plotW} by ${plotD} foot plot`} role="img" />;
}
