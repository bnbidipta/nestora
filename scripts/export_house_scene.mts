/**
 * Exports a design's 3D house for Blender: the same geometry (frontend/lib/house3d.ts) and colours (houseScene.ts) as the
 * web 3D view, as house.obj + scene.json (materials, sun, plot), in metres, Z up, road along -Y.
 * Outer walls keep the finish on their outside face only, as on the web.
 *
 * Usage (Node 22.18+ runs TypeScript directly):
 *   node scripts/export_house_scene.mts <house_id> [more ids] [--api https://nestora-api-vpia.onrender.com] [--out data/kaggle/nestora-renders]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildHouse, type Box, type Look } from '../frontend/lib/house3d.ts';
import { materials } from '../frontend/lib/houseScene.ts';

const FT = 0.3048;
const args = process.argv.slice(2);
const opt = (k: string, d: string) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const API = opt('--api', 'https://nestora-api-vpia.onrender.com');
const OUT = opt('--out', 'data/kaggle/nestora-renders');

async function exportOne(id: string) {
  const res = await fetch(`${API}/api/v1/house/${id}`);
  if (!res.ok) throw new Error(`${id}: ${res.status}`);
  const twin = (await res.json()).data;
  const md = twin.metadata ?? {};
  const look = md.look as Look | undefined;
  const sbSide = Number(md.setback_side_m ?? 0) / FT, sbFront = Number(md.setback_front_m ?? 0) / FT;
  const plot: [number, number, number, number] = [-sbSide, -sbFront, -sbSide + twin.plot.plot_width_ft, -sbFront + twin.plot.plot_depth_ft];
  const house = buildHouse(twin.floors.map((f: any) => ({ floor_no: f.floor_no, floor_height_ft: f.floor_height_ft, rooms: f.rooms })),
    () => undefined, { look, plot });
  const mats = materials(look, undefined);

  // materials by their three.js identity -> name + the values Blender needs
  const names = new Map<object, string>();
  const table: Record<string, { color: string; roughness: number; metalness: number; opacity: number; kind: string; finish: string | null }> = {};
  const ex = look?.exterior;
  const finishOf = (kind: string, up?: boolean) => ['wall', 'gable', 'mumty', 'parapet', 'boundary'].includes(kind) ? ((up && ex?.wall[1]) || ex?.wall[0] || null)
    : kind === 'roof' ? ((look as any)?.roof?.material ?? ex?.roof_material ?? null) : null;
  const nameOf = (m: any, kind = 'mat', up?: boolean) => {
    if (!names.has(m)) {
      const n = `m${names.size}_${kind}`;
      names.set(m, n);
      table[n] = { color: `#${m.color.getHexString()}`, roughness: m.roughness, metalness: m.metalness, opacity: m.transparent ? m.opacity : 1,
        kind, finish: finishOf(kind, up) };
    }
    return names.get(m)!;
  };

  const v: string[] = [], f: string[] = [];
  let n = 0, cur = '';
  const use = (name: string) => { if (name !== cur) { f.push(`usemtl ${name}`); cur = name; } };
  const P = (x: number, y: number, z: number) => `v ${(x * FT).toFixed(4)} ${(y * FT).toFixed(4)} ${(z * FT).toFixed(4)}`;
  const interior = nameOf(mats.byKind('interior' as any), 'interior');
  for (const b of house.boxes as Box[]) {
    const m = nameOf(mats.byKind(b.kind, b.colour, b.up), b.kind, b.up);
    for (const [x, y, z] of [[b.x0, b.y0, b.z0], [b.x1, b.y0, b.z0], [b.x1, b.y1, b.z0], [b.x0, b.y1, b.z0],
      [b.x0, b.y0, b.z1], [b.x1, b.y0, b.z1], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]]) v.push(P(x, y, z));
    const q = (a: number, b2: number, c: number, d: number) => `f ${n + a} ${n + b2} ${n + c} ${n + d}`;
    // faces: -y (front), +y (rear), -x (left), +x (right), bottom, top; outer walls: finish outside, plaster inside
    const faces: [string, string][] = [['y-', q(1, 2, 6, 5)], ['y+', q(3, 4, 8, 7)], ['x-', q(4, 1, 5, 8)], ['x+', q(2, 3, 7, 6)], ['bot', q(4, 3, 2, 1)], ['top', q(5, 6, 7, 8)]];
    for (const [side, face] of faces) {
      use(b.kind === 'wall' && (!b.out || (side !== b.out && side !== 'top' && side !== 'bot')) ? interior : m);
      f.push(face);
    }
    n += 8;
  }
  for (const t of house.tris) {
    use(nameOf(mats.byKind(t.kind, undefined, true), t.kind, true));
    for (let i = 0; i < t.p.length; i += 9) {
      for (let k = 0; k < 9; k += 3) v.push(P(t.p[i + k], t.p[i + k + 1], t.p[i + k + 2]));
      f.push(`f ${n + 1} ${n + 2} ${n + 3}`);
      n += 3;
    }
  }
  const dir = join(OUT, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'house.obj'), `# Nestora ${id}\n${v.join('\n')}\n${f.join('\n')}\n`);
  const [p0, q0, p1, q1] = plot;
  writeFileSync(join(dir, 'scene.json'), JSON.stringify({
    id, materials: table, units: 'm', road: '-y',
    plot: [p0 * FT, q0 * FT, p1 * FT, q1 * FT], roof_top_m: house.roofTop * FT,
    look: look ? { archetype: look.archetype, style: (look as any).style, exterior: look.exterior } : null,
  }, null, 1));
  console.log(`${id}: ${house.boxes.length} boxes, ${Object.keys(table).length} materials -> ${dir}`);
}

for (const id of args) await exportOne(id);
