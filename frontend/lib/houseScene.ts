/**
 * Turns buildHouse() output into three.js meshes: one material per element kind, shared by the 3D viewer and the
 * option-card still renderer so both show the same architecture.
 */
import * as THREE from 'three';
import type { Box, Look, Tri } from './house3d';

export interface Palette { wall?: string; accent?: string; wood?: string; floor?: string }

export function materials(look: Look | undefined, pal: Palette | undefined, night = false) {
  const cache = new Map<string, THREE.Material>();
  const std = (key: string, p: THREE.MeshStandardMaterialParameters) => {
    if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial(p));
    return cache.get(key)!;
  };
  const wall = look?.facade.wall ?? pal?.wall ?? '#F1EDE4';
  const wood = look?.facade.wood ?? pal?.wood ?? '#7A4E2D';
  const accent = look?.facade.accent ?? pal?.accent ?? '#B5651D';
  const glass = () => std('glass', { color: night ? '#ffd9a0' : '#9fb7c6', roughness: 0.08, metalness: 0.3, transparent: true, opacity: night ? 0.85 : 0.42, emissive: night ? '#7a5520' : '#000000' });
  const byKind = (k: Box['kind'] | Tri['kind'], colour?: string): THREE.Material => {
    switch (k) {
      case 'slab': return std('slab', { color: '#D4CFC5', roughness: 0.9 });
      case 'step': return std('step', { color: '#B9B3A8', roughness: 0.9 });
      case 'lining': return std(`l${colour}`, { color: colour, roughness: 0.9 });
      case 'glass': return glass();
      case 'rail': return look?.facade.rail === 'jaali' ? std('jaali', { color: wood, roughness: 0.7, transparent: true, opacity: 0.8 })
        : look?.facade.rail === 'glass' ? glass() : std('rail', { color: '#3f3f3f', roughness: 0.5, metalness: 0.5, transparent: true, opacity: 0.75 });
      case 'chhajja': return std('chhajja', { color: '#CFC9BE', roughness: 0.9 });
      case 'jaali': return std('jaali', { color: wood, roughness: 0.7, transparent: true, opacity: 0.8 });
      case 'plinth': return std('plinth', { color: '#8B8478', roughness: 0.95 });
      case 'band': return std('band', { color: accent, roughness: 0.8 });
      case 'pergola': return std('pergola', { color: wood, roughness: 0.7 });
      case 'tank': return std('tank', { color: '#2a2a2a', roughness: 0.6 });
      case 'garden': return std('garden', { color: '#5C8A46', roughness: 1 });
      case 'roof': return std('roof', { color: look?.roof.tile ?? '#A0522D', roughness: 0.75, side: THREE.DoubleSide });
      case 'gable': return std('gable', { color: wall, roughness: 0.9, side: THREE.DoubleSide });
      default: return std('wall', { color: wall, roughness: 0.9 });  // wall, parapet, mumty
    }
  };
  return { byKind, dispose: () => cache.forEach((m) => m.dispose()) };
}

/**
 * Adds the house to a scene. P maps plan feet (x along the road, y away from it, z up) to scene space.
 * topShown cuts away everything above that height (floor cutaway). Returns the geometries to dispose.
 */
export function addHouse(scene: THREE.Scene, house: { boxes: Box[]; tris: Tri[] }, P: (x: number, y: number, z: number) => THREE.Vector3,
  byKind: (k: Box['kind'] | Tri['kind'], colour?: string) => THREE.Material, opts: { topShown?: number; shadows?: boolean } = {}) {
  const top = opts.topShown ?? Infinity, shadows = opts.shadows ?? true;
  const geos: THREE.BufferGeometry[] = [];
  for (const b of house.boxes) {
    if (b.z0 >= top) continue;
    const g = new THREE.BoxGeometry(b.x1 - b.x0, b.z1 - b.z0, b.y1 - b.y0);
    geos.push(g);
    const mesh = new THREE.Mesh(g, byKind(b.kind, b.colour));
    mesh.position.copy(P((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2));
    mesh.castShadow = shadows && b.kind !== 'glass';
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  if (top === Infinity) {
    for (const kind of ['roof', 'gable'] as const) {  // all roof triangles of one kind in one mesh
      const pts = house.tris.filter((t) => t.kind === kind).flatMap((t) => t.p);
      if (!pts.length) continue;
      const pos: number[] = [];
      for (let i = 0; i < pts.length; i += 3) { const v = P(pts[i], pts[i + 1], pts[i + 2]); pos.push(v.x, v.y, v.z); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      geos.push(g);
      const mesh = new THREE.Mesh(g, byKind(kind));
      mesh.castShadow = shadows; mesh.receiveShadow = true;
      scene.add(mesh);
    }
  }
  return geos;
}
