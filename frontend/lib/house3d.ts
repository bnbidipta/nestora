/**
 * Turns the twin's room rectangles into one connected building: walls merged where rooms share them, door and window
 * openings cut in, slabs, a stair, a roof parapet. Pure geometry (plan feet), no three.js, so it can be checked on its own.
 * Plan: x along the road, y away from the road (front of the house at y = 0).
 * ponytail: doors sit near the start of the room's door wall; real door positions come with a full drawing set.
 */
export interface PRoom { name: string; type?: string | null; x: number; y: number; length_ft: number; width_ft: number; exterior?: boolean; window_area_sqft?: number; door_width_mm?: number }
export interface Box { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; kind: 'wall' | 'parapet' | 'slab' | 'step' | 'lining'; room?: string; colour?: string }
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

export function buildHouse(floors: FloorIn[], doorWall: (room: string) => string | undefined, opts: { paint?: Record<string, { side: string; hex: string }[]>; terrace?: boolean } = {}) {
  const boxes: Box[] = [];
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
            ? { kind: l.parapet ? 'parapet' : 'wall', x0: p.a, x1: p.b, y0: l.c - t / 2, y1: l.c + t / 2, z0: base + p.z0, z1: base + p.z1 }
            : { kind: l.parapet ? 'parapet' : 'wall', x0: l.c - t / 2, x1: l.c + t / 2, y0: p.a, y1: p.b, z0: base + p.z0, z1: base + p.z1 });
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
  // roof slab and parapet over the top floor
  const top = levels[levels.length - 1];
  if (top) {
    const [x0, y0, x1, y1] = top.bbox;
    boxes.push({ kind: 'slab', x0, x1, y0, y1, z0: base, z1: base + SLAB });
    const z0 = base + SLAB, z1 = base + SLAB + PARAPET;
    boxes.push({ kind: 'parapet', x0, x1, y0, y1: y0 + EXT_T / 2, z0, z1 }, { kind: 'parapet', x0, x1, y0: y1 - EXT_T / 2, y1, z0, z1 },
      { kind: 'parapet', x0, x1: x0 + EXT_T / 2, y0, y1, z0, z1 }, { kind: 'parapet', x0: x1 - EXT_T / 2, x1, y0, y1, z0, z1 });
  }
  return { boxes, levels, roofZ: base + SLAB };
}

/** 2D blockers for walking at body height on one level (walls whose piece spans 1–5 ft above that floor). */
export function blockers(boxes: Box[], base: number): Box[] {
  return boxes.filter((b) => (b.kind === 'wall' || b.kind === 'parapet') && b.z0 <= base + 1 && b.z1 >= base + 2);
}

export function collides(bs: Box[], x: number, y: number, rad = 0.8): boolean {
  return bs.some((b) => {
    const cx = Math.max(b.x0, Math.min(x, b.x1)), cy = Math.max(b.y0, Math.min(y, b.y1));
    return (x - cx) ** 2 + (y - cy) ** 2 < rad * rad;
  });
}
