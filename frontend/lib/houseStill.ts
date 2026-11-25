/**
 * A three-quarter exterior picture of an option, rendered once in the browser with one shared WebGL renderer
 * (so a board of cards never runs out of GL contexts) and cached as an image URL per option.
 */
import * as THREE from 'three';
import { Look, buildHouse } from './house3d';
import { addHouse, materials } from './houseScene';

type PRoom = { f: number; id: string; t: string; x: number; y: number; w: number; d: number };
let renderer: THREE.WebGLRenderer | null = null;
const cache = new Map<string, string>();

export function renderStill(key: string, rooms: PRoom[], look: Look | undefined, w = 640, h = 420): string {
  const hit = cache.get(key);
  if (hit) return hit;
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NeutralToneMapping;
  }
  renderer.setSize(w, h, false);
  const floorNos = Array.from(new Set(rooms.map((r) => r.f))).sort((a, b) => a - b);
  const house = buildHouse(floorNos.map((f) => ({
    floor_no: f, floor_height_ft: 10,
    rooms: rooms.filter((r) => r.f === f).map((r) => ({ name: r.id, type: r.t, x: r.x, y: r.y, length_ft: r.w, width_ft: r.d, exterior: true })),
  })), () => undefined, { look });
  const xs = rooms.flatMap((r) => [r.x, r.x + r.w]), ys = rooms.flatMap((r) => [r.y, r.y + r.d]);
  const W = Math.max(...xs) - Math.min(...xs), D = Math.max(...ys) - Math.min(...ys);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const P = (x: number, y: number, z: number) => new THREE.Vector3(x - cx, z, cy - y);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#EFE8DC');
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9ad98, 1.1));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
  const R = Math.max(W, D, house.roofTop) * 1.6;
  sun.position.set(R * 0.7, R * 1.1, R * 0.9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: R * 4 });
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(R * 4, R * 4), new THREE.MeshStandardMaterial({ color: '#CFD8B8', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);
  const mats = materials(look, undefined);
  const geos = addHouse(scene, house, P, mats.byKind);

  const camera = new THREE.PerspectiveCamera(32, w / h, 0.5, R * 10);
  const H = house.roofTop;
  camera.position.set(R * 0.95, H * 0.9 + R * 0.45, R * 1.25);  // front-right, from the road side, a little above
  camera.lookAt(0, H * 0.42, 0);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/jpeg', 0.85);
  geos.forEach((g) => g.dispose());
  ground.geometry.dispose();
  (ground.material as THREE.Material).dispose();
  mats.dispose();
  cache.set(key, url);
  return url;
}

let queue: Promise<unknown> = Promise.resolve();
/** Same picture, but queued: one render per frame, so a board of cards never freezes the page. */
export function renderStillQueued(key: string, rooms: PRoom[], look: Look | undefined): Promise<string> {
  const job = queue.then(() => new Promise<string>((ok, fail) => requestAnimationFrame(() => {
    try { ok(renderStill(key, rooms, look)); } catch (e) { fail(e); }
  })));
  queue = job.catch(() => undefined);
  return job;
}
