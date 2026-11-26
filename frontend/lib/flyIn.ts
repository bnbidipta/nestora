/**
 * A 7-second vertical (720x1280) fly-in of a design, recorded in the browser: it opens on the flat coloured plan, the
 * walls rise floor by floor while the camera lifts into a three-quarter view, then a slow orbit. No server; the video is
 * recorded from the canvas with MediaRecorder (WebM, or MP4 where the browser supports it).
 */
import * as THREE from 'three';
import { Look, buildHouse } from './house3d';
import { addHouse, materials } from './houseScene';
import { FILL } from './rooms';

export interface FlyRoom { f: number; name: string; t: string; x: number; y: number; w: number; d: number }

const W = 720, H = 1280, SECONDS = 7, FPS = 30;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function flyInSupported(): boolean {
  return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;
}

function mime(): string {
  for (const m of ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']) if (MediaRecorder.isTypeSupported(m)) return m;
  return 'video/webm';
}

export async function recordFlyIn(rooms: FlyRoom[], look: Look | undefined, plot: [number, number, number, number] | undefined, caption: string,
  onProgress?: (p: number) => void): Promise<{ blob: Blob; ext: string }> {
  const floorNos = Array.from(new Set(rooms.map((r) => r.f))).sort((a, b) => a - b);
  const house = buildHouse(floorNos.map((f) => ({
    floor_no: f, floor_height_ft: 10,
    rooms: rooms.filter((r) => r.f === f).map((r) => ({ name: r.name, type: r.t, x: r.x, y: r.y, length_ft: r.w, width_ft: r.d, exterior: true })),
  })), () => undefined, { look, plot });
  const xs = rooms.flatMap((r) => [r.x, r.x + r.w]), ys = rooms.flatMap((r) => [r.y, r.y + r.d]);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const P = (x: number, y: number, z: number) => new THREE.Vector3(x - cx, z, cy - y);

  const gl = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  gl.setSize(W, H, false);
  gl.shadowMap.enabled = true;
  gl.toneMapping = THREE.NeutralToneMapping;
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);  // everything above the rising height is hidden
  gl.clippingPlanes = [clip];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#EFE8DC');
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9ad98, 1.1));
  const R = Math.max(span, house.roofTop) * 1.5;
  const sun = new THREE.DirectionalLight(0xffe7c4, 2.4);
  sun.position.set(R * 0.8, R * 1.2, R * 0.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: R * 5 });
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(R * 6, R * 6), new THREE.MeshStandardMaterial({ color: '#CFD8B8', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.55;
  ground.receiveShadow = true;
  scene.add(ground);
  // the flat plan: every ground-floor room as a coloured tile, covered as the walls rise
  const tiles: THREE.BufferGeometry[] = [], tileMats: THREE.Material[] = [];
  for (const r of rooms.filter((q) => q.f === floorNos[0])) {
    const g = new THREE.BoxGeometry(r.w - 0.2, 0.1, r.d - 0.2), m = new THREE.MeshStandardMaterial({ color: FILL[r.t] ?? '#EEEEEE', roughness: 1 });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.copy(P(r.x + r.w / 2, r.y + r.d / 2, 0.06));
    scene.add(mesh); tiles.push(g); tileMats.push(m);
  }
  const mats = materials(look, undefined);
  const geos = addHouse(scene, house, P, mats.byKind);
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.5, R * 20);

  // the recorded canvas: the 3D frame plus a small caption at the end
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  const stream = out.captureStream(FPS);
  const type = mime();
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((res) => { rec.onstop = () => res(); });
  rec.start();

  const top = house.roofTop + 2;
  const frame = (t: number) => {  // t in seconds
    const rise = ease(Math.min(1, Math.max(0, (t - 1.2) / 3.6)));
    clip.constant = 0.2 + rise * top;
    const orbit = ease(Math.min(1, t / 5)) * 0.9 + Math.max(0, t - 5) * 0.12;
    const tilt = ease(Math.min(1, Math.max(0, (t - 0.8) / 4)));
    const dist = R * (2.9 - 0.3 * tilt);  // a tall frame is narrow: stand back enough to keep the whole house in
    const yaw = -0.6 + orbit;
    camera.position.set(Math.sin(yaw) * dist * (0.05 + 0.75 * tilt), dist * (1.25 - 0.75 * tilt), Math.cos(yaw) * dist * (0.05 + 0.75 * tilt));
    camera.lookAt(0, top * 0.35 * tilt, 0);
    gl.render(scene, camera);
    ctx.drawImage(gl.domElement, 0, 0);
    const a = Math.min(1, Math.max(0, (t - 5.2) / 0.8));
    if (a > 0) {
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(20,20,20,0.55)';
      ctx.fillRect(0, H - 170, W, 170);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 40px Georgia, serif';
      ctx.fillText(caption, 48, H - 100);
      ctx.font = '500 26px system-ui, sans-serif';
      ctx.fillText('Designed with Nestora', 48, H - 55);
      ctx.globalAlpha = 1;
    }
  };
  // real-time playback (MediaRecorder records wall-clock time); frames are rendered on each animation frame
  await new Promise<void>((res) => {
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      frame(Math.min(t, SECONDS));
      onProgress?.(Math.min(1, t / SECONDS));
      if (t < SECONDS) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  await done;
  geos.forEach((g) => g.dispose());
  tiles.forEach((g) => g.dispose());
  tileMats.forEach((m) => m.dispose());
  ground.geometry.dispose();
  (ground.material as THREE.Material).dispose();
  mats.dispose();
  gl.dispose();
  return { blob: new Blob(chunks, { type: type.split(';')[0] }), ext: type.includes('mp4') ? 'mp4' : 'webm' };
}
