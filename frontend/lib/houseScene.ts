/**
 * Turns buildHouse() output into three.js meshes: one material per element kind, shared by the 3D viewer and the
 * option-card still renderer so both show the same architecture. Wall and roof finishes are small canvas textures
 * mapped in plan feet, so a brick is brick-sized on every wall.
 */
import * as THREE from 'three';
import type { Box, Look, Tri } from './house3d';

export interface Palette { wall?: string; accent?: string; wood?: string; floor?: string }

/** Finish -> [base colour (null = the user's wall colour), pattern, tile size in feet]. */
const FINISH: Record<string, [string | null, string, number]> = {
  plaster_paint: [null, 'noise', 6], textured_stucco: [null, 'stucco', 4], whitewash_lime: ['#F3F0E8', 'stucco', 4],
  exposed_brick: ['#A4553A', 'brick', 2.6], laterite: ['#A85B3C', 'block', 4], stone_cladding: ['#A79C8B', 'stone', 4],
  exposed_concrete: ['#A9A7A1', 'formwork', 8], wood_cladding: ['#9A6B43', 'boards', 4], charred_timber: ['#2C2A28', 'boards', 4],
  metal_cladding: ['#6E747A', 'seams', 4], wood_shingle: ['#8E6A48', 'shingle', 3], adobe: ['#C49A6C', 'stucco', 5],
  glass_curtain: ['#8FA9B8', 'curtain', 10],
};
const ROOF: Record<string, [string, string, number]> = {
  mangalore_tile: ['#A14B2F', 'tiles', 3], clay_barrel: ['#B8643A', 'tiles', 2.5], metal_seam: ['#4A4F55', 'seams', 4],
  slate: ['#4B5058', 'shingle', 2.5], wood_shingle: ['#7B5A3C', 'shingle', 2.5], green_roof: ['#5E7D3E', 'noise', 4],
};

function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, f);
  return `#${c.getHexString()}`;
}

/** A 128 px repeating pattern. Deterministic (seeded), so every render of a design looks the same. */
function pattern(base: string, kind: string): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const S = 128, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d')!;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  const line = (c: string, w: number, x0: number, y0: number, x1: number, y1: number) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const dark = shade(base, -0.12), light = shade(base, 0.08), mortar = shade(base, 0.25);
  switch (kind) {
    case 'noise': case 'stucco':
      for (let i = 0; i < (kind === 'stucco' ? 900 : 300); i++) { g.fillStyle = rnd() > 0.5 ? dark : light; g.globalAlpha = 0.18; g.fillRect(rnd() * S, rnd() * S, 2, 2); }
      break;
    case 'brick': case 'block': {
      const rows = kind === 'brick' ? 8 : 4, h = S / rows, w = kind === 'brick' ? S / 4 : S / 2;
      for (let r = 0; r < rows; r++) for (let x = (r % 2) * -w / 2; x < S; x += w) {
        g.fillStyle = shade(base, (rnd() - 0.5) * 0.1); g.fillRect(x + 1.5, r * h + 1.5, w - 3, h - 3);
        if (kind === 'block') for (let i = 0; i < 12; i++) { g.fillStyle = dark; g.globalAlpha = 0.5; g.fillRect(x + rnd() * w, r * h + rnd() * h, 2, 2); g.globalAlpha = 1; }
      }
      g.globalAlpha = 1;
      for (let r = 0; r <= rows; r++) line(mortar, 3, 0, r * h, S, r * h);
      break;
    }
    case 'stone':
      for (let y = 0; y < S; y += 21) for (let x = -(rnd() * 20); x < S; x += 22 + rnd() * 24) {
        g.fillStyle = shade(base, (rnd() - 0.5) * 0.18); g.fillRect(x + 2, y + 2, 20 + rnd() * 22, 17);
      }
      break;
    case 'formwork':
      for (let r = 0; r <= 2; r++) line(dark, 1, 0, r * S / 2, S, r * S / 2);
      for (let c = 0; c <= 1; c++) line(dark, 1, c * S, 0, c * S, S);
      g.fillStyle = dark;
      for (const [x, y] of [[S / 4, S / 4], [3 * S / 4, S / 4], [S / 4, 3 * S / 4], [3 * S / 4, 3 * S / 4]]) { g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill(); }
      break;
    case 'boards': case 'seams':
      for (let x = 0; x < S; x += S / 8) { g.fillStyle = shade(base, (rnd() - 0.5) * (kind === 'boards' ? 0.12 : 0.04)); g.fillRect(x, 0, S / 8, S); line(dark, kind === 'seams' ? 3 : 1.5, x, 0, x, S); }
      break;
    case 'shingle': case 'tiles':
      for (let r = 0; r < 8; r++) for (let x = (r % 2) * 8; x < S + 16; x += 16) {
        g.fillStyle = shade(base, (rnd() - 0.5) * 0.12);
        if (kind === 'tiles') { g.beginPath(); g.ellipse(x, r * 16 + 12, 8, 10, 0, 0, Math.PI); g.fill(); } else g.fillRect(x - 7, r * 16 + 2, 14, 14);
        line(dark, 1.5, 0, r * 16, S, r * 16);
      }
      break;
    case 'curtain':
      g.fillStyle = light; g.globalAlpha = 0.35; g.fillRect(0, 0, S, S / 2); g.globalAlpha = 1;
      line('#2a2a2a', 4, 0, 0, S, 0); line('#2a2a2a', 4, 0, 0, 0, S); line('#2a2a2a', 2, S / 2, 0, S / 2, S);
      break;
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type MatKind = Box['kind'] | Tri['kind'] | 'interior';

export function materials(look: Look | undefined, pal: Palette | undefined, night = false) {
  const cache = new Map<string, THREE.Material>();
  const texs: THREE.Texture[] = [];
  const std = (key: string, p: THREE.MeshStandardMaterialParameters) => {
    if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial(p));
    return cache.get(key)!;
  };
  const ex = look?.exterior;
  const wall = ex?.wall_colour ?? look?.facade.wall ?? pal?.wall ?? '#F1EDE4';
  const wood = look?.facade.wood ?? pal?.wood ?? '#7A4E2D';
  const accent = ex?.accent_colour ?? look?.facade.accent ?? pal?.accent ?? '#B5651D';
  const glass = () => std('glass', { color: night ? '#ffd9a0' : '#9fb7c6', roughness: 0.08, metalness: 0.3, transparent: true, opacity: night ? 0.85 : 0.42, emissive: night ? '#7a5520' : '#000000' });
  const finished = (key: string, [c, kind, tile]: [string | null, string, number], rough = 0.9) => {
    if (cache.has(key)) return cache.get(key)!;
    const base = c ?? wall, map = pattern(base, kind);
    if (map) { map.userData.tile = tile; texs.push(map); }
    return std(key, { color: map ? '#ffffff' : base, map, roughness: kind === 'curtain' ? 0.15 : rough, metalness: kind === 'seams' || kind === 'curtain' ? 0.35 : 0, side: THREE.DoubleSide });
  };
  const wallMat = (up?: boolean) => {
    const f = (up && ex?.wall[1]) || ex?.wall[0];
    return f && FINISH[f] ? finished(`w_${f}`, FINISH[f]) : std('wall', { color: wall, roughness: 0.9 });
  };
  const frame = { dark_metal: '#2B2B2B', white: '#F4F2EC', natural_wood: wood, colour_accent: accent, aluminium: '#B9BDC1' }[ex?.frame ?? ''] ?? '#3a3a3a';
  const railing = ex?.railing ?? look?.facade.rail;
  const roofMat = ex && ROOF[look?.roof.material ?? ex.roof_material];
  const byKind = (k: MatKind, colour?: string, up?: boolean): THREE.Material => {
    switch (k) {
      case 'slab': return std('slab', { color: '#D4CFC5', roughness: 0.9 });
      case 'step': return std('step', { color: '#B9B3A8', roughness: 0.9 });
      case 'lining': return std(`l${colour}`, { color: colour, roughness: 0.9 });
      case 'glass': return glass();
      case 'rail':
        if (railing === 'jaali') return std('jaali', { color: wood, roughness: 0.7, transparent: true, opacity: 0.8 });
        if (railing === 'glass') return glass();
        if (railing === 'wood_baluster') return std('rail_w', { color: wood, roughness: 0.7, transparent: true, opacity: 0.85 });
        if (railing === 'solid_parapet') return wallMat(true);
        return std('rail', { color: '#3f3f3f', roughness: 0.5, metalness: 0.5, transparent: true, opacity: 0.75 });
      case 'chhajja': return std('chhajja', { color: '#CFC9BE', roughness: 0.9 });
      case 'jaali': return std('jaali', { color: wood, roughness: 0.7, transparent: true, opacity: 0.8 });
      case 'plinth': return std('plinth', { color: '#8B8478', roughness: 0.95 });
      case 'band': case 'trim': return std('band', { color: ex?.trim === 'quoins' || ex?.trim === 'window_surrounds' ? shade(wall, 0.06) : accent, roughness: 0.8 });
      case 'frame': return std('frame', { color: frame, roughness: 0.5, metalness: ex?.frame === 'dark_metal' || ex?.frame === 'aluminium' ? 0.4 : 0 });
      case 'shutter': return std('shutter', { color: ex?.frame === 'natural_wood' ? wood : accent, roughness: 0.7 });
      case 'column': return std('column', { color: shade(wall, 0.05), roughness: 0.8 });
      case 'canopy': return colour === 'roof' && roofMat ? finished(`r_${look?.roof.material ?? ex?.roof_material}`, roofMat, 0.75) : std('canopy', { color: '#CFC9BE', roughness: 0.85 });
      case 'porchfloor': return std('porchfloor', { color: '#B8B0A2', roughness: 0.9 });
      case 'boundary': return wallMat(false);
      case 'hedge': return std('hedge', { color: '#4E7A3A', roughness: 1 });
      case 'gate': return std('gate', { color: '#2E2E2E', roughness: 0.5, metalness: 0.5 });
      case 'picket': return std('picket', { color: '#F2F0EA', roughness: 0.8 });
      case 'pergola': return std('pergola', { color: wood, roughness: 0.7 });
      case 'tank': return std('tank', { color: '#2a2a2a', roughness: 0.6 });
      case 'garden': return std('garden', { color: '#5C8A46', roughness: 1 });
      case 'roof': return roofMat ? finished(`r_${look?.roof.material ?? ex?.roof_material}`, roofMat, 0.75) : std('roof', { color: look?.roof.tile ?? '#A0522D', roughness: 0.75, side: THREE.DoubleSide });
      case 'gable': return wallMat(true);
      case 'interior': return std('interior', { color: '#EEEAE2', roughness: 0.9 });
      case 'wall': case 'mumty': return wallMat(up || k === 'mumty');
      default: return wallMat(false);  // parapet
    }
  };
  return { byKind, dispose: () => { cache.forEach((m) => m.dispose()); texs.forEach((t) => t.dispose()); } };
}

/** UVs in plan feet / tile size, from world positions, so patterns are continuous and correctly scaled. */
function worldUV(g: THREE.BufferGeometry, offset: THREE.Vector3, tile: number) {
  const pos = g.getAttribute('position'), nor = g.getAttribute('normal');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + offset.x, y = pos.getY(i) + offset.y, z = pos.getZ(i) + offset.z;
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    const [u, v] = nx >= ny && nx >= nz ? [z, y] : nz >= ny ? [x, y] : [x, z];
    uv[i * 2] = u / tile; uv[i * 2 + 1] = v / tile;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/**
 * Adds the house to a scene. P maps plan feet (x along the road, y away from it, z up) to scene space.
 * topShown cuts away everything above that height (floor cutaway). Returns the geometries to dispose.
 */
export function addHouse(scene: THREE.Scene, house: { boxes: Box[]; tris: Tri[] }, P: (x: number, y: number, z: number) => THREE.Vector3,
  byKind: (k: MatKind, colour?: string, up?: boolean) => THREE.Material, opts: { topShown?: number; shadows?: boolean } = {}) {
  const top = opts.topShown ?? Infinity, shadows = opts.shadows ?? true;
  const geos: THREE.BufferGeometry[] = [];
  const tileOf = (m: THREE.Material) => ((m as THREE.MeshStandardMaterial).map?.userData.tile as number | undefined);
  for (const b of house.boxes) {
    if (b.z0 >= top) continue;
    const g = new THREE.BoxGeometry(b.x1 - b.x0, b.z1 - b.z0, b.y1 - b.y0);
    geos.push(g);
    const m = byKind(b.kind, b.colour, b.up);
    // outer walls: the finish on the outside face only (BoxGeometry face order +x,-x,+y,-y,+z,-z; plan y runs to scene -z)
    const face = b.kind === 'wall' ? ({ 'x+': 0, 'x-': 1, 'y-': 4, 'y+': 5 } as const)[b.out ?? 'x+'] : -1;
    const inner = byKind('interior');
    const mesh = new THREE.Mesh(g, b.kind === 'wall' ? [0, 1, 2, 3, 4, 5].map((i) => (b.out && i === face ? m : b.out && (i === 2 || i === 3) ? m : inner)) : m);
    mesh.position.copy(P((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2));
    const tile = tileOf(m);
    if (tile) worldUV(g, mesh.position, tile);
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
      const m = byKind(kind, undefined, true);
      const tile = tileOf(m);
      if (tile) worldUV(g, new THREE.Vector3(), tile);
      const mesh = new THREE.Mesh(g, m);
      mesh.castShadow = shadows; mesh.receiveShadow = true;
      scene.add(mesh);
    }
  }
  return geos;
}
