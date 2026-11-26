/**
 * A street-view snapshot of a design's 3D model (1344x768 PNG): from across the road, a little above eye level,
 * 28 mm lens, golden-hour sun. It is the guide image the GPU service repaints into a photo, so it must show the
 * exact house: same geometry and finishes as the 3D view.
 */
import * as THREE from 'three';
import { Look, buildHouse } from './house3d';
import { addHouse, materials } from './houseScene';

export interface SnapRoom { f: number; name: string; t: string; x: number; y: number; w: number; d: number }
const W = 1344, H = 768, FT = 3.28084;

export function streetView(rooms: SnapRoom[], look: Look | undefined, plot?: [number, number, number, number]): string {
  const floorNos = Array.from(new Set(rooms.map((r) => r.f))).sort((a, b) => a - b);
  const house = buildHouse(floorNos.map((f) => ({
    floor_no: f, floor_height_ft: 10,
    rooms: rooms.filter((r) => r.f === f).map((r) => ({ name: r.name, type: r.t, x: r.x, y: r.y, length_ft: r.w, width_ft: r.d, exterior: true })),
  })), () => undefined, { look, plot });
  const xs = rooms.flatMap((r) => [r.x, r.x + r.w]), ys = rooms.flatMap((r) => [r.y, r.y + r.d]);
  // frame the whole plot (compound wall included), as the Blender camera does
  const [minX, minY, maxX, maxY] = plot ?? [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const span = Math.max(maxX - minX, maxY - minY, house.roofTop * 1.4);
  const P = (x: number, y: number, z: number) => new THREE.Vector3(x - cx, z, cy - y);

  const gl = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  gl.setSize(W, H, false);
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  gl.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#B9D3EA');
  scene.add(new THREE.HemisphereLight(0xdfeaf5, 0x8a7f6a, 1.0));
  const sun = new THREE.DirectionalLight(0xffd9a8, 2.6);  // low warm sun from the front-right
  const R = span * 2;
  sun.position.set(R * 0.9, R * 0.45, R * 0.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: R * 5 });
  scene.add(sun);
  const disp: { dispose: () => void }[] = [];
  const plane = (w: number, d: number, colour: string, x: number, y: number, z: number) => {
    const g = new THREE.PlaneGeometry(w, d), m = new THREE.MeshStandardMaterial({ color: colour, roughness: 1 });
    const mesh = new THREE.Mesh(g, m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(P(x, y, z));
    mesh.receiveShadow = true;
    scene.add(mesh); disp.push(g, m);
  };
  plane(4000, 4000, '#7E9A5A', cx, cy, -0.55);  // ground to the horizon
  plane((plot ? plot[2] - plot[0] : maxX - minX) + 200, 24, '#55585C', cx, (plot ? plot[1] : minY) - 13, -0.5);  // the road
  const mats = materials(look, undefined);
  const geos = addHouse(scene, house, P, mats.byKind);

  const camera = new THREE.PerspectiveCamera(46.4, W / H, 0.5, 5000);  // 28 mm on full frame
  const front = plot ? plot[1] : minY;
  camera.position.copy(P(cx + span * 0.42, front - span * 0.62, 1.8 * FT));
  camera.lookAt(P(cx, cy, house.roofTop * 0.42));
  gl.render(scene, camera);
  const url = gl.domElement.toDataURL('image/png');
  geos.forEach((g) => g.dispose());
  disp.forEach((d) => d.dispose());
  mats.dispose();
  gl.dispose();
  return url;
}
