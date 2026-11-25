/**
 * Turns the twin's room rectangles into one connected building: walls merged where rooms share them, door and window
 * openings cut in, slabs, a stair, a roof parapet. Pure geometry (plan feet), no three.js, so it can be checked on its own.
 * Plan: x along the road, y away from the road (front of the house at y = 0).
 * ponytail: doors sit near the start of the room's door wall; real door positions come with a full drawing set.
 */
export interface PRoom { name: string; type?: string | null; x: number; y: number; length_ft: number; width_ft: number; exterior?: boolean; window_area_sqft?: number; door_width_mm?: number }
export type Kind = 'wall' | 'parapet' | 'slab' | 'step' | 'lining' | 'glass' | 'chhajja' | 'jaali' | 'plinth' | 'band' | 'pergola' | 'tank' | 'garden' | 'mumty' | 'rail';
export interface Box { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; kind: Kind; room?: string; colour?: string }
/** A roof plane or gable end as triangles in plan feet: [x, y, z] x 3 per triangle. */
export interface Tri { kind: 'roof' | 'gable'; p: number[] }
/** The architecture from the backend (services/look.py); metres. */
export interface Look {
  archetype: 'terrace' | 'sloped' | 'stepped' | 'mixed';
  roof: { form: 'flat' | 'gable' | 'hip'; pitch_deg: number; eave_m: number; tile: string; cover: number };
  terrace: { usable: boolean; parapet_m: number; pergola: boolean; garden: boolean; tank: boolean; mumty: boolean; pavilion: number };
  shading: { chhajja_m: number; jaali: boolean; fins: boolean };
  facade: { plinth_m: number; wall: string; accent: string; wood: string; rail: string; band: boolean };
}
interface Opening { a: number; b: number; bottom: number; top: number }
type Side = 'front' | 'rear' | 'left' | 'right';

const EXT_T = 0.75, INT_T = 0.4, DOOR_H = 7, SILL = 3, VENT_SILL = 5.5, PARAPET = 3.5, SLAB = 0.45;
const OPEN_TYPES = ['porch', 'balcony'];
const r1 = (v: number) => Math.round(v * 10) / 10;

function edges(r: PRoom): { side: Side; horiz: boolean; c: number; a: number; b: number }[] {
  const x1 = r.x + r.length_ft, y1 = r.y + r.width_ft;
  return [
    { side: 'front', horiz: true, c: r.y, a: r.x, b: x1 }, { side: 'rear', horiz: true, c: y1, a: r.x, b: x1 },
    { side: 'left', horiz: false, c: r.x, a: r.y, b: y1 }, { side: 'right', horiz: false, c: x1, a: r.y, b: y1 },
  ];
}

function union(iv: [number, number][]): [number, number][] {
  const s = [...iv].sort((p, q) => p[0] - q[0]);
  const out: [number, number][] = [];
  for (const [a, b] of s) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + 0.05) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

/** Wall pieces along [a, b] on one line, height H, with openings cut out (each opening leaves a sill and a lintel piece). */
function pieces(a: number, b: number, H: number, ops: Opening[]): { a: number; b: number; z0: number; z1: number }[] {
  const cuts = ops.filter((o) => o.b > a && o.a < b);
  const pts = Array.from(new Set([a, b, ...cuts.flatMap((o) => [Math.max(a, o.a), Math.min(b, o.b)])])).sort((p, q) => p - q);
  const out: { a: number; b: number; z0: number; z1: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p, q] = [pts[i], pts[i + 1]];
    if (q - p < 0.02) continue;
    const o = cuts.find((c) => c.a <= (p + q) / 2 && c.b >= (p + q) / 2);
    if (!o) out.push({ a: p, b: q, z0: 0, z1: H });
    else {
      if (o.bottom > 0.05) out.push({ a: p, b: q, z0: 0, z1: o.bottom });
      if (o.top < H - 0.05) out.push({ a: p, b: q, z0: o.top, z1: H });
    }
  }
  return out;
}

export interface FloorIn { floor_no: number; floor_height_ft: number; rooms: PRoom[] }

const M = 3.28084;

/** Pitched roof over a rectangle: gable or hip, ridge along the longer side, eaves overhanging by e. */
function pitched(x0: number, y0: number, x1: number, y1: number, z0: number, form: 'gable' | 'hip', pitch: number, e: number): Tri[] {
  const alongX = x1 - x0 >= y1 - y0;
  const [u0, u1, v0, v1] = alongX ? [x0, x1, y0, y1] : [y0, y1, x0, x1];  // u along the ridge, v across
  const k = Math.tan((pitch * Math.PI) / 180), vm = (v0 + v1) / 2, half = (v1 - v0) / 2;
  const ze = z0 - e * k, zr = z0 + half * k;
  const U0 = u0 - e, U1 = u1 + e, V0 = v0 - e, V1 = v1 + e;
  const h = form === 'hip' ? Math.min(half + e, (U1 - U0) / 2) : 0;
  const R0 = [U0 + h, vm, zr], R1 = [U1 - h, vm, zr];
  const pt = (a: number[]) => (alongX ? [a[0], a[1], a[2]] : [a[1], a[0], a[2]]);
  const t3 = (a: number[], b: number[], c: number[]) => [...pt(a), ...pt(b), ...pt(c)];
  const q4 = (a: number[], b: number[], c: number[], d: number[]) => [...t3(a, b, c), ...t3(a, c, d)];
  const out: Tri[] = [
    { kind: 'roof', p: q4([U0, V0, ze], [U1, V0, ze], R1, R0) },
    { kind: 'roof', p: q4([U1, V1, ze], [U0, V1, ze], R0, R1) },
  ];
  if (form === 'hip') out.push({ kind: 'roof', p: t3([U0, V1, ze], [U0, V0, ze], R0) }, { kind: 'roof', p: t3([U1, V0, ze], [U1, V1, ze], R1) });
  else out.push({ kind: 'gable', p: t3([u0, v0, z0], [u0, v1, z0], [u0, vm, zr]) }, { kind: 'gable', p: t3([u1, v1, z0], [u1, v0, z0], [u1, vm, zr]) });
  return out;
}

export function buildHouse(floors: FloorIn[], doorWall: (room: string) => string | undefined, opts: { paint?: Record<string, { side: string; hex: string }[]>; terrace?: boolean; look?: Look } = {}) {
  const look = opts.look;
  const boxes: Box[] = [];
  const tris: Tri[] = [];
  const win: { side: Side; horiz: boolean; c: number; a: number; b: number; bottom: number; top: number; base: number; t: string }[] = [];
  const levels: { floor: number; base: number; height: number; bbox: [number, number, number, number] }[] = [];
  let base = 0;
  for (const f of [...floors].sort((p, q) => p.floor_no - q.floor_no)) {
    const H = f.floor_height_ft;
    const rs = f.rooms.filter((r) => r.length_ft > 0.3 && r.width_ft > 0.3);
    if (!rs.length) continue;
    const bx0 = Math.min(...rs.map((r) => r.x)), by0 = Math.min(...rs.map((r) => r.y));
    const bx1 = Math.max(...rs.map((r) => r.x + r.length_ft)), by1 = Math.max(...rs.map((r) => r.y + r.width_ft));
    const isExt = (horiz: boolean, c: number) => (horiz ? Math.abs(c - by0) < 0.1 || Math.abs(c - by1) < 0.1 : Math.abs(c - bx0) < 0.1 || Math.abs(c - bx1) < 0.1);
    levels.push({ floor: f.floor_no, base, height: H, bbox: [bx0, by0, bx1, by1] });

    // openings per line key
    const ops = new Map<string, Opening[]>();
    const addOp = (horiz: boolean, c: number, o: Opening) => { const k = `${horiz ? 'h' : 'v'}${r1(c)}`; ops.set(k, [...(ops.get(k) ?? []), o]); };
    for (const r of rs) {
      const t = r.type ?? '';
      const es = edges(r);
      if (!OPEN_TYPES.includes(t)) {  // door: on its door wall, unless that's an outside wall of an inner room
        const main = ['entrance', 'living'].includes(t) && f.floor_no === 0;
        let e = es.find((x) => x.side === doorWall(r.name)) ?? es[0];
        if (isExt(e.horiz, e.c) && !main) e = [...es].filter((x) => !isExt(x.horiz, x.c)).sort((p, q) => (q.b - q.a) - (p.b - p.a))[0] ?? e;
        const w = Math.min((r.door_width_mm ?? 900) / 304.8, e.b - e.a - 0.6);
        if (w > 1.5 && t !== 'stair' && t !== 'lift') addOp(e.horiz, e.c, { a: e.a + 0.4, b: e.a + 0.4 + w, bottom: 0, top: DOOR_H });
        if (t === 'stair' || t === 'lift') addOp(e.horiz, e.c, { a: e.a + 0.3, b: e.a + 0.3 + Math.min(3.2, e.b - e.a - 0.6), bottom: 0, top: DOOR_H });
      }
      for (const e of es) {  // windows on outside walls
        if (!isExt(e.horiz, e.c) || OPEN_TYPES.includes(t) || t === 'stair' || t === 'lift' || t === 'store') continue;
        const L = e.b - e.a;
        if (L < 3) continue;
        const vent = t === 'toilet' || t === 'utility' || t === 'laundry';
        const w = vent ? Math.min(2, L - 1) : Math.min(L - 2, Math.max(3, (r.window_area_sqft ?? 12) / 4 / (r.exterior ? 1 : 2)));
        const mid = (e.a + e.b) / 2;
        addOp(e.horiz, e.c, { a: mid - w / 2, b: mid + w / 2, bottom: vent ? VENT_SILL : SILL, top: DOOR_H });
        win.push({ side: e.side, horiz: e.horiz, c: e.c, a: mid - w / 2, b: mid + w / 2, bottom: vent ? VENT_SILL : SILL, top: DOOR_H, base, t });
      }
    }

    // merged walls by line and kind
    const lines = new Map<string, { horiz: boolean; c: number; ext: boolean; parapet: boolean; iv: [number, number][] }>();
    for (const r of rs) {
      const open = OPEN_TYPES.includes(r.type ?? '');
      for (const e of edges(r)) {
        const ext = isExt(e.horiz, e.c);
        if (open && ext && r.type === 'porch') continue;  // open parking: no outer wall
        const parapet = open && ext;
        const k = `${e.horiz ? 'h' : 'v'}${r1(e.c)}${parapet ? 'p' : ''}`;
        const l = lines.get(k) ?? { horiz: e.horiz, c: e.c, ext, parapet, iv: [] };
        l.iv.push([e.a, e.b]);
        lines.set(k, l);
      }
    }
    for (const [k, l] of Array.from(lines)) {
      const t = l.ext ? EXT_T : INT_T;
      const hh = l.parapet ? PARAPET : H;
      for (const [a, b] of union(l.iv)) {
        for (const p of pieces(a, b, hh, l.parapet ? [] : ops.get(k) ?? [])) {
          boxes.push(l.horiz
            ? { kind: l.parapet ? (look ? 'rail' : 'parapet') : 'wall', x0: p.a, x1: p.b, y0: l.c - t / 2, y1: l.c + t / 2, z0: base + p.z0, z1: base + p.z1 }
            : { kind: l.parapet ? (look ? 'rail' : 'parapet') : 'wall', x0: l.c - t / 2, x1: l.c + t / 2, y0: p.a, y1: p.b, z0: base + p.z0, z1: base + p.z1 });
        }
      }
    }

    // paint: a thin coloured lining on each room's inner wall faces, with the same openings cut out
    if (opts.paint) {
      for (const r of rs) {
        for (const w of opts.paint[r.name] ?? []) {
          const e = edges(r).find((x) => x.side === w.side);
          if (!e) continue;
          const k = `${e.horiz ? 'h' : 'v'}${r1(e.c)}`;
          const t = (isExt(e.horiz, e.c) ? EXT_T : INT_T) / 2 + 0.03;
          const inward = e.side === 'front' || e.side === 'left' ? 1 : -1;
          const c = e.c + inward * t;
          for (const p of pieces(e.a + t, e.b - t, H, ops.get(k) ?? [])) {
            boxes.push(e.horiz
              ? { kind: 'lining', room: r.name, colour: w.hex, x0: p.a, x1: p.b, y0: c - 0.02, y1: c + 0.02, z0: base + p.z0, z1: base + p.z1 }
              : { kind: 'lining', room: r.name, colour: w.hex, x0: c - 0.02, x1: c + 0.02, y0: p.a, y1: p.b, z0: base + p.z0, z1: base + p.z1 });
          }
        }
      }
    }

    // slab under this floor, and a stair in the stair room
    boxes.push({ kind: 'slab', x0: bx0, x1: bx1, y0: by0, y1: by1, z0: base - SLAB, z1: base });
    for (const r of rs.filter((x) => x.type === 'stair')) {
      const along = r.width_ft >= r.length_ft;  // climb along the longer side
      const run = along ? r.width_ft : r.length_ft, n = Math.max(8, Math.round(H / 0.58)), d = run / n;
      for (let i = 0; i < n; i++) {
        boxes.push(along
          ? { kind: 'step', x0: r.x + 0.3, x1: r.x + r.length_ft - 0.3, y0: r.y + i * d, y1: r.y + (i + 1) * d, z0: base, z1: base + ((i + 1) * H) / n }
          : { kind: 'step', x0: r.x + i * d, x1: r.x + (i + 1) * d, y0: r.y + 0.3, y1: r.y + r.width_ft - 0.3, z0: base, z1: base + ((i + 1) * H) / n });
      }
    }
    base += H;
  }
  const top = levels[levels.length - 1];
  const parapetRing = (x0: number, y0: number, x1: number, y1: number, z0: number, h: number, open: Side[] = []) => {
    const z1 = z0 + h, t = EXT_T / 2;
    if (!open.includes('front')) boxes.push({ kind: 'parapet', x0, x1, y0, y1: y0 + t, z0, z1 });
    if (!open.includes('rear')) boxes.push({ kind: 'parapet', x0, x1, y0: y1 - t, y1, z0, z1 });
    if (!open.includes('left')) boxes.push({ kind: 'parapet', x0, x1: x0 + t, y0, y1, z0, z1 });
    if (!open.includes('right')) boxes.push({ kind: 'parapet', x0: x1 - t, x1, y0, y1, z0, z1 });
  };
  // where a floor reaches beyond the floor above, its roof is a terrace: slab plus parapet
  for (let i = 0; i < levels.length - 1; i++) {
    const [a0, b0, a1, b1] = levels[i].bbox, [c0, d0, c1, d1] = levels[i + 1].bbox, zb = levels[i + 1].base;
    if (a0 < c0 - 0.5 || b0 < d0 - 0.5 || a1 > c1 + 0.5 || b1 > d1 + 0.5) {
      boxes.push({ kind: 'slab', x0: a0, x1: a1, y0: b0, y1: b1, z0: zb - SLAB, z1: zb });
      parapetRing(a0, b0, a1, b1, zb, look ? look.terrace.parapet_m * M : PARAPET);
    }
  }
  let roofTop = base + SLAB + PARAPET;
  if (top && !look) {  // plain flat roof with parapet (no architecture data)
    const [x0, y0, x1, y1] = top.bbox;
    boxes.push({ kind: 'slab', x0, x1, y0, y1, z0: base, z1: base + SLAB });
    parapetRing(x0, y0, x1, y1, base + SLAB, PARAPET);
  }
  if (top && look) {
    const [x0, y0, x1, y1] = top.bbox;
    const z = base + SLAB, D = y1 - y0, deg = Math.PI / 180;
    boxes.push({ kind: 'slab', x0, x1, y0, y1, z0: base, z1: z });
    const ph = look.terrace.parapet_m * M, eave = look.roof.eave_m * M, pitch = look.roof.pitch_deg;
    const form = look.roof.form === 'gable' ? 'gable' : 'hip';
    const stairs = floors.find((f) => f.floor_no === top.floor)?.rooms.filter((r) => r.type === 'stair') ?? [];
    // pitched part at the rear (cover = its share of the depth), usable flat terrace in front
    const cover = look.archetype === 'sloped' ? 1 : look.archetype === 'mixed' ? look.roof.cover || 0.55 : 0;
    const yCut = y1 - cover * D;
    roofTop = z;
    if (cover > 0) {
      tris.push(...pitched(x0, yCut, x1, y1, z, form, pitch, eave));
      roofTop = Math.max(roofTop, z + (Math.min(x1 - x0, y1 - yCut) / 2) * Math.tan(pitch * deg));
    }
    if (cover < 1) {
      const ty1 = cover > 0 ? yCut : y1;
      parapetRing(x0, y0, x1, ty1, z, ph, cover > 0 ? ['rear'] : []);
      roofTop = Math.max(roofTop, z + ph);
      if (look.terrace.garden) {  // planter beds along the front and one side
        boxes.push({ kind: 'garden', x0: x0 + 0.4, x1: x1 - 0.4, y0: y0 + 0.4, y1: y0 + 2, z0: z, z1: z + 1.5 },
          { kind: 'garden', x0: x0 + 0.4, x1: x0 + 2, y0: y0 + 2, y1: ty1 - 0.5, z0: z, z1: z + 1.5 });
      }
      const pav = look.terrace.pavilion;
      const py0 = y1 - pav * D;
      if (pav > 0) {  // stepped: a covered sit-out over the rear, glazed to the front, roof overhanging
        const hh = 9;
        boxes.push({ kind: 'mumty', x0, x1, y0: y1 - EXT_T, y1, z0: z, z1: z + hh }, { kind: 'mumty', x0, x1: x0 + EXT_T, y0: py0, y1, z0: z, z1: z + hh },
          { kind: 'mumty', x0: x1 - EXT_T, x1, y0: py0, y1, z0: z, z1: z + hh }, { kind: 'glass', x0: x0 + EXT_T, x1: x1 - EXT_T, y0: py0, y1: py0 + 0.1, z0: z + 0.5, z1: z + hh - 0.5 },
          { kind: 'slab', x0: x0 - 1.5, x1: x1 + 1.5, y0: py0 - 3, y1: y1 + 1, z0: z + hh, z1: z + hh + SLAB });
        roofTop = Math.max(roofTop, z + hh + SLAB);
      }
      if (look.terrace.pergola) {  // timber pergola over the open terrace
        const gy0 = y0 + 3, gy1 = (pav > 0 ? py0 - 3 : ty1) - 2;
        if (gy1 - gy0 > 4) {
          const gx0 = x0 + 3, gx1 = x1 - 3, gz = z + 8;
          for (const [px, py] of [[gx0, gy0], [gx1, gy0], [gx0, gy1], [gx1, gy1]]) boxes.push({ kind: 'pergola', x0: px - 0.25, x1: px + 0.25, y0: py - 0.25, y1: py + 0.25, z0: z, z1: gz });
          boxes.push({ kind: 'pergola', x0: gx0 - 0.5, x1: gx1 + 0.5, y0: gy0 - 0.2, y1: gy0 + 0.2, z0: gz, z1: gz + 0.5 }, { kind: 'pergola', x0: gx0 - 0.5, x1: gx1 + 0.5, y0: gy1 - 0.2, y1: gy1 + 0.2, z0: gz, z1: gz + 0.5 });
          for (let x = gx0; x <= gx1 + 0.01; x += 1.6) boxes.push({ kind: 'pergola', x0: x - 0.12, x1: x + 0.12, y0: gy0 - 1, y1: gy1 + 1, z0: gz + 0.5, z1: gz + 0.85 });
          roofTop = Math.max(roofTop, gz + 0.85);
        }
      }
      if (look.terrace.mumty) {  // stair room on the terrace, the water tank on top of it
        for (const s of stairs.filter((r) => r.y + r.width_ft / 2 < ty1)) {
          const mz = z + 8;
          boxes.push({ kind: 'mumty', x0: s.x, x1: s.x + s.length_ft, y0: s.y, y1: s.y + s.width_ft, z0: z, z1: mz },
            { kind: 'slab', x0: s.x - 0.8, x1: s.x + s.length_ft + 0.8, y0: s.y - 0.8, y1: s.y + s.width_ft + 0.8, z0: mz, z1: mz + SLAB });
          if (look.terrace.tank) boxes.push({ kind: 'tank', x0: s.x + 1, x1: s.x + 5, y0: s.y + 1, y1: s.y + 5, z0: mz + SLAB, z1: mz + SLAB + 4.5 });
          roofTop = Math.max(roofTop, mz + SLAB + 4.5);
        }
      }
    }
    // plinth, floor bands, and shading over every outside window
    const g = levels[0];
    if (g) {
      const [a0, b0, a1, b1] = g.bbox;
      boxes.push({ kind: 'plinth', x0: a0 - 0.3, x1: a1 + 0.3, y0: b0 - 0.3, y1: b1 + 0.3, z0: -0.5, z1: Math.min(look.facade.plinth_m * M, 1.5) - 0.5 });
    }
    if (look.facade.band) {
      for (const lv of levels.slice(1)) {
        const [a0, b0, a1, b1] = lv.bbox, o = 0.25;
        boxes.push({ kind: 'band', x0: a0 - o, x1: a1 + o, y0: b0 - o, y1: b0, z0: lv.base - SLAB, z1: lv.base + 0.4 },
          { kind: 'band', x0: a0 - o, x1: a1 + o, y0: b1, y1: b1 + o, z0: lv.base - SLAB, z1: lv.base + 0.4 });
      }
    }
    const ch = look.shading.chhajja_m * M;
    for (const w of win) {
      const out = w.side === 'front' || w.side === 'left' ? -1 : 1;
      const t = EXT_T / 2;
      const along = (a: number, b: number, n0: number, n1: number, z0: number, z1: number, kind: Kind): Box =>
        w.horiz ? { kind, x0: a, x1: b, y0: Math.min(n0, n1), y1: Math.max(n0, n1), z0, z1 } : { kind, x0: Math.min(n0, n1), x1: Math.max(n0, n1), y0: a, y1: b, z0, z1 };
      boxes.push(along(w.a, w.b, w.c - 0.05, w.c + 0.05, w.base + w.bottom, w.base + w.top, 'glass'));
      if (ch > 0.2) boxes.push(along(w.a - 0.6, w.b + 0.6, w.c + out * t, w.c + out * (t + ch), w.base + w.top + 0.2, w.base + w.top + 0.55, 'chhajja'));
      if (look.shading.jaali && w.side === 'front' && !['toilet', 'utility', 'laundry'].includes(w.t)) {
        boxes.push(along(w.a, w.b, w.c + out * (t + 0.15), w.c + out * (t + 0.3), w.base + w.bottom, w.base + w.top, 'jaali'));
      }
      if (look.shading.fins && w.side === 'front') {
        for (const fx of [w.a - 0.3, w.b + 0.3]) boxes.push(along(fx - 0.15, fx + 0.15, w.c + out * t, w.c + out * (t + 1.5), w.base + w.bottom - 1, w.base + w.top + 0.5, 'chhajja'));
      }
    }
  }
  return { boxes, tris, levels, roofZ: base + SLAB, roofTop };
}

/** 2D blockers for walking at body height on one level (walls whose piece spans 1–5 ft above that floor). */
export function blockers(boxes: Box[], base: number): Box[] {
  return boxes.filter((b) => ['wall', 'parapet', 'rail', 'mumty'].includes(b.kind) && b.z0 <= base + 1 && b.z1 >= base + 2);
}

export function collides(bs: Box[], x: number, y: number, rad = 0.8): boolean {
  return bs.some((b) => {
    const cx = Math.max(b.x0, Math.min(x, b.x1)), cy = Math.max(b.y0, Math.min(y, b.y1));
    return (x - cx) ** 2 + (y - cy) ** 2 < rad * rad;
  });
}
