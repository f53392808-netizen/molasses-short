// Oopsonomics ep01, 3D test (first 58.2 s of the VO). One town (world3d.ts); shots = camera keys + who stands where.
// Everything is a pure function of time t (s) = frame / 30.
import { WORDS } from "./words";
import { ARM, act, CharState, CharDef, BUCK, LASZLO, DRIVER, extra } from "../oops/cast";

export const FPS = 30;
export const TOTAL = 1746; // 58.2 s: cut after "...one small internet forum." (57.8 s)
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// extra arm poses (added at runtime, oops/cast.ts untouched)
(ARM as any).holdHigh = { e: [30, 26], h: [-2, 30], front: true };
(ARM as any).cheer = { e: [30, -30], h: [34, -78], open: true };
(ARM as any).eat = { e: [22, 30], h: [-20, -14], front: true };

// ---------------- places (m) ----------------
export const BUCK_HOOK: V3 = [-50, 0.15, -5.6];
export const PEDESTAL: V3 = [-44.3, 0.08, -9.6];
export const DOOR_X = 74, HOUSE = { x0: 67, x1: 81, z0: -21, z1: -11, h: 3.2, floor: 0.25 };
export const CRT: { pos: V3; yaw: number } = { pos: [78.25, 1.03, -20.3], yaw: -0.75 }; // screen normal (sin yaw, 0, cos yaw)
export const SCREEN_C: V3 = [CRT.pos[0] + Math.sin(CRT.yaw) * 0.232, CRT.pos[1] + 0.26, CRT.pos[2] + Math.cos(CRT.yaw) * 0.232];
const scr = (d: number, dy = 0, da = 0.45): V3 => [SCREEN_C[0] + Math.sin(CRT.yaw + da) * d, SCREEN_C[1] + dy, SCREEN_C[2] + Math.cos(CRT.yaw + da) * d];
export const STAND: V3 = [20, 0.15, -5.9]; // the tiny "bitcoin" table on the 2010 sidewalk
export const groundY = (x: number, z: number) => {
  if (x > HOUSE.x0 && x < HOUSE.x1 && z > HOUSE.z0 && z < HOUSE.z1) return HOUSE.floor;
  if (x > 72 && x < 76 && z >= HOUSE.z1 && z < -9.6) return 0.25; // porch
  if (x > -66 && x < -34 && z > -26 && z < -7) return 0.08; // plaza paving
  const a = Math.abs(z);
  return a < 4 ? 0.02 : a < 7 ? 0.15 : 0;
};

// ---------------- shots ----------------
type Key = [number, V3, V3, number?]; // t, pos, look, fov
export type Shot = { id: string; a: number; b: number; keys: Key[]; inside?: boolean; shadow: number };
export const SHOTS: Shot[] = [
  { id: "hook", a: 0, b: 2.6, shadow: 70, keys: [
    [0.0, [-128, 52, 46], [-62, 4, -10], 55], [0.55, [-96, 20, 14], [-54, 2, -7], 50], [1.15, [-66, 4.2, 2.6], [-50, 1.5, -6], 44],
    [1.8, [-52.6, 1.75, -1.0], [-50, 1.4, -5.8], 40], [2.6, [-51.4, 1.62, -1.75], [-50, 1.38, -5.8], 38]] },
  { id: "crowd", a: 2.6, b: 6.6, shadow: 30, keys: [
    [2.6, [-59, 2.4, 2.4], [-50, 1.7, -10], 46], [4.6, [-50.5, 4.2, 3.6], [-50, 1.8, -10.5], 46], [6.6, [-41.5, 3.0, 1.2], [-50.5, 1.6, -10], 46]] },
  { id: "fancy", a: 6.6, b: 9.1, shadow: 25, keys: [
    [6.6, [-42.0, 1.75, -6.2], [-44.3, 1.15, -9.6], 40], [7.6, [-42.9, 1.65, -5.4], [-44.6, 1.15, -9.2], 40],
    [8.6, [-46.6, 1.75, -1.6], [-47.2, 1.35, -5.8], 40], [9.1, [-47.0, 1.7, -1.9], [-47.2, 1.35, -5.8], 39]] },
  { id: "deliver", a: 9.1, b: 15.4, shadow: 40, keys: [
    [9.1, [60.5, 2.3, 0.8], [65.5, 2.4, 8], 44], [10.5, [63.5, 2.0, -2.2], [68, 1.2, 3], 44], [11.8, [67.6, 2.2, -2.6], [72, 1.2, -6], 44],
    [12.9, [69.6, 1.8, -6.4], [73.6, 1.35, -10.4], 42], [14.0, [69.9, 2.6, -5.2], [74, 1.7, -11], 44], [15.4, [64.5, 10, 5.5], [74, 2.8, -13], 48]] },
  { id: "billion", a: 15.4, b: 22.93, shadow: 35, keys: [
    [15.4, [62.4, 1.7, -1.2], [64.9, 1.35, -5.4], 42], [18.0, [62.0, 2.2, 0.2], [66.2, 1.7, -6.2], 44],
    [19.5, [61.6, 3.0, 3.4], [69, 2.4, -8], 48], [22.93, [59.8, 4.4, 4.8], [69.5, 2.7, -8.2], 48]] },
  { id: "porch", a: 22.93, b: 28.9, shadow: 25, keys: [
    [22.93, [70.6, 1.75, -3.6], [73.6, 1.3, -10], 42], [25.6, [72.2, 1.65, -5.0], [74.2, 1.35, -10.2], 42], [28.9, [74.6, 2.7, -5.6], [75.3, 1.75, -10.1], 42]] },
  { id: "dinner", a: 28.9, b: 35.1, shadow: 25, inside: true, keys: [
    [28.9, [75.2, 1.65, -13.2], [77.5, 1.05, -19.3], 44], [32.0, [76.4, 1.5, -14.6], [77.6, 1.05, -19.4], 44], [35.1, [77.4, 1.5, -15.5], [77.8, 1.08, -19.5], 44]] },
  { id: "coin", a: 35.1, b: 40.75, shadow: 25, inside: true, keys: [
    [35.1, [79.6, 1.4, -16.2], [77.6, 1.0, -19.8], 44], [37.6, [79.2, 1.35, -16.5], [77.8, 1.15, -19.9], 44], [40.75, [78.9, 1.2, -16.6], [77.9, 1.75, -19.9], 46]] },
  { id: "rewind", a: 40.75, b: 43.0, shadow: 120, keys: [
    [40.75, [73.5, 4.5, -2], [75, 2, -14], 46], [41.7, [58, 28, 26], [42, 0, -8], 50], [43.0, [40, 40, 44], [8, 0, -10], 52]] },
  { id: "y2010", a: 43.0, b: 48.0, shadow: 30, keys: [
    [43.0, [13.6, 1.8, 2.6], [19, 1.2, -5.5], 42], [45.5, [17.6, 1.6, 1.6], [20.6, 1.1, -5.6], 42], [48.0, [22.6, 1.9, 1.7], [20.8, 1.15, -5.7], 42]] },
  { id: "game", a: 48.0, b: 53.75, shadow: 25, inside: true, keys: [
    [48.0, [76.2, 1.7, -14.6], [78.5, 1.15, -19.3], 44], [51.0, [77.6, 1.55, -15.2], [78.9, 1.15, -19.5], 44], [53.75, [79.2, 1.55, -15.6], [79.1, 1.15, -19.6], 44]] },
  { id: "forum", a: 53.75, b: 58.21, shadow: 25, inside: true, keys: [
    [53.75, scr(2.1, 0.3, 0.9), SCREEN_C, 44], [56.0, scr(1.25, 0.12, 0.7), SCREEN_C, 42], [58.21, scr(0.72, 0.02, 0.5), SCREEN_C, 40]] },
];
export const shotAt = (t: number) => SHOTS.find((s) => t >= s.a && t < s.b) ?? SHOTS[SHOTS.length - 1];

// camera: cubic Hermite in time, Catmull-Rom tangents (smooth velocity), plus impact kicks
const herm = (k: Key[], t: number, sel: 1 | 2) => {
  let i = 0; while (i < k.length - 2 && t > k[i + 1][0]) i++;
  const p = (j: number) => k[Math.max(0, Math.min(k.length - 1, j))];
  const t0 = p(i)[0], t1 = p(i + 1)[0], h = t1 - t0, u = clamp01((t - t0) / h);
  const tan = (j: number, c: number) => { const a = p(j - 1), b = p(j + 1); return (b[sel][c] - a[sel][c]) / Math.max(1e-3, b[0] - a[0]); };
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return [0, 1, 2].map((c) => h00 * p(i)[sel][c] + h10 * h * tan(i, c) + h01 * p(i + 1)[sel][c] + h11 * h * tan(i + 1, c)) as V3;
};
export const KICKS = [0.33, 19.36, 41.7, 7.2];
export const camAt = (t: number) => {
  const s = shotAt(t), k = s.keys;
  const pos = herm(k, t, 1), look = herm(k, t, 2);
  let i = 0; while (i < k.length - 2 && t > k[i + 1][0]) i++;
  const u = clamp01((t - k[i][0]) / (k[i + 1][0] - k[i][0]));
  const fov = lerp(k[i][3] ?? 44, k[i + 1][3] ?? 44, smooth(u));
  let roll = 0;
  for (const kt of KICKS) { const df = Math.round((t - kt) * FPS); if (df >= 0 && df < 8) { const a = (1 - df / 8) * (df % 2 ? -1 : 1); roll += a * 0.02; pos[1] += a * 0.05; } }
  return { pos, look, fov, roll, shot: s };
};

// ---------------- lip flap ----------------
export const talkAt = (t: number) => {
  for (const [a, b] of WORDS) if (t >= a - 0.04 && t < b - 0.03) return 0.35 + 0.65 * Math.abs(Math.sin((t - a) * Math.PI * 6.5));
  return 0;
};

// ---------------- walkers ----------------
type PK = [number, number, number]; // t, x, z
/** position on a timed polyline, walking flag, phase (distance / stride), direction */
export const walk = (t: number, pts: PK[]) => {
  let dist = 0, x = pts[0][1], z = pts[0][2], moving = false, dx = 0, dz = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, x0, z0] = pts[i], [t1, x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0);
    if (t >= t1) { dist += L; x = x1; z = z1; if (L > 0.01) { dx = x1 - x0; dz = z1 - z0; } continue; }
    if (t > t0) { const u = (t - t0) / (t1 - t0); x = lerp(x0, x1, u); z = lerp(z0, z1, u); dist += L * u; moving = L > 0.01; if (L > 0.01) { dx = x1 - x0; dz = z1 - z0; } }
    break;
  }
  // card squash at start/stop (a quick turn between side and front view)
  let sq = 1;
  for (let i = 0; i < pts.length; i++) {
    const prevMove = i > 0 && Math.hypot(pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]) > 0.01;
    const nextMove = i < pts.length - 1 && Math.hypot(pts[i + 1][1] - pts[i][1], pts[i + 1][2] - pts[i][2]) > 0.01;
    if (prevMove !== nextMove && (i > 0 && i < pts.length - 1)) sq = Math.min(sq, 0.12 + 0.88 * smooth(Math.abs(t - pts[i][0]) / 0.12));
  }
  return { x, z, moving, phase: dist / 1.45, dx, dz, sq };
};

// ---------------- who is where ----------------
export type Who = { c: CharDef; pos: V3; st: CharState; dir?: [number, number]; sq?: number; k?: number; blob?: boolean };
const mixA = (a: any, b: any, u: number) => ({ e: [lerp(a.e[0], b.e[0], u), lerp(a.e[1], b.e[1], u)], h: [lerp(a.h[0], b.h[0], u), lerp(a.h[1], b.h[1], u)], front: u < 0.5 ? a.front : b.front, open: true });
const at = (x: number, z: number, dy = 0): V3 => [x, groundY(x, z) + dy, z];
const buck = (t: number, x: number, z: number, keys: [number, CharState][]): Who => {
  const st = act(t, [[-9, { prop: null }], ...keys]);
  return { c: BUCK, pos: at(x, z), st: { ...st, talk: talkAt(t) } };
};
const typing = (st: CharState, t: number) => {
  const A = ARM.type, o = Math.sin(t * 22), o2 = Math.sin(t * 19 + 1.3);
  return { ...st, armL: { ...A, h: [A.h[0], A.h[1] - 5 * Math.max(0, o)] }, armR: { ...A, h: [A.h[0], A.h[1] - 5 * Math.max(0, o2)] } } as CharState;
};
const walker = (c: CharDef, t: number, pts: PK[], st: CharState = {}): Who => {
  const w = walk(t, pts);
  const s: CharState = w.moving ? { mode: "stroll", phase: w.phase, expr: st.expr ?? "neutral", prop: st.prop } : act(t, [[-9, st]]);
  return { c, pos: at(w.x, w.z), st: { ...s, ...(w.moving ? {} : st) , mode: w.moving ? "stroll" : "stand", phase: w.phase }, dir: [w.dx, w.dz], sq: w.sq };
};

export const cast = (t: number): Who[] => {
  const s = shotAt(t).id, out: Who[] = [];
  if (s === "hook" || s === "crowd" || s === "fancy") {
    out.push(buck(t, BUCK_HOOK[0] + (s === "fancy" ? 2.8 : 0), BUCK_HOOK[2] - (s === "fancy" ? 0.2 : 0), s === "fancy"
      ? [[6.6, { prop: "boxes", L: "hold", R: "hold", expr: "flat", facing: -1 }], [8.56, { L: "holdHigh" as any, R: "holdHigh" as any, expr: "grin", facing: 0, tilt: -2 }]]
      : [[0, { prop: "boxes", L: "holdHigh" as any, R: "holdHigh" as any, expr: "wide", tilt: 2 }], [1.5, { expr: "grin", tilt: -1 }],
         [3.4, { L: "hold", R: "hold", expr: "smile" }], [4.8, { L: "holdHigh" as any, R: "holdHigh" as any, expr: "grin", tilt: 3 }]]));
    if (s === "fancy") { const sh = clamp01((t - 6.75) / 0.9); out[0].st.headTilt = (out[0].st.headTilt ?? 0) + (sh > 0 && sh < 1 ? 7 * Math.sin(sh * Math.PI * 4) : 0); }
    if (s !== "fancy") for (let i = 0; i < 10; i++) {
      const x = -56.5 + (i % 5) * 3.1 + (i > 4 ? 1.4 : 0), z = -9.4 - (i > 4 ? 4.2 : 0) - (i % 2) * 0.9, ph = t * 2.6 + i * 1.7;
      const st: CharState = { expr: (["laugh", "grin", "wide", "smile"] as const)[i % 4], facing: ((i % 3) - 1) as any };
      st.armL = mixA(ARM.wave, (ARM as any).cheer, 0.5 + 0.5 * Math.sin(ph)) as any; st.armR = mixA((ARM as any).cheer, ARM.wave, 0.5 + 0.5 * Math.sin(ph + 1)) as any;
      if (i % 4 === 3) { st.prop = "slice"; st.armR = ARM.eat as any; }
      out.push({ c: extra(i), pos: at(x, z, 0.22 * Math.max(0, Math.sin(ph * 1.3))), st, k: 0.6 });
    }
  }
  if (s === "deliver") {
    const d = walker(DRIVER, t, [[9.1, 66, 6.9], [9.35, 66, 6.9], [10.8, 69.6, 0.4], [11.9, 72.6, -5.6], [12.85, 73.2, -10.0], [99, 73.2, -10.0]],
      { prop: "boxes", L: "hold", R: "hold", expr: "neutral" });
    d.st.prop = "boxes";
    if (!d.st.mode || d.st.mode === "stand") { d.st = { ...act(t, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }], [13.6, { expr: "smile" }]]) }; }
    out.push(d);
    if (t > 13.25) out.push({ c: LASZLO, pos: [DOOR_X + 0.05, HOUSE.floor, -11.4], st: act(t, [[0, { expr: "wide", L: "down", R: "down", facing: -1 }], [13.9, { expr: "grin", R: "wave" }], [14.8, { R: "down" }]]), blob: false });
  }
  if (s === "billion") out.push(buck(t, 64.5, -5.3, [[15.4, { facing: 0, expr: "neutral", L: "down", R: "down" }], [16.9, { R: "present", facing: 1, expr: "smile" }],
    [19.3, { R: "point", L: "shrug", expr: "shock", tilt: -3 }], [20.9, { expr: "flat", L: "down", tilt: 0 }], [21.8, { R: "down", facing: 0 }]]));
  if (s === "porch") {
    out.push({ c: LASZLO, pos: [72.9, 0.25, -10.25], st: act(t, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "grin", facing: 1 }], [26.9, { expr: "laugh" }], [28.06, { expr: "grin", facing: 0 }]]) });
    out.push(buck(t, 71.2, -8.4, [[22.93, { expr: "neutral", facing: 1 }], [24.8, { R: "point", expr: "flat" }], [27.0, { expr: "shock", L: "shrug" }], [28.3, { expr: "flat" }]]));
  }
  if (s === "dinner" || s === "coin" || s === "game" || s === "forum") {
    let st: CharState;
    if (s === "dinner") {
      const k: [number, CharState][] = [[0, { mode: "sit", prop: "slice", expr: "content", facing: 0, L: "desk" }]];
      for (let q = 29.2; q < 35.1; q += 1.5) { k.push([q, { R: "eat" as any, expr: "lick" }]); k.push([q + 0.7, { R: "hold", expr: "content" }]); }
      st = act(t, k, 0.3);
    } else if (s === "coin") {
      st = act(t, [[0, { mode: "sit", expr: "neutral", facing: 1 }], [37.3, { expr: "o", headTilt: -6 }], [39.8, { expr: "grin" }]]);
      if (t < 37.4) st = typing(st, t);
    } else {
      st = act(t, [[0, { mode: "sit", expr: "neutral", facing: 1 }], [50.9, { expr: "grin" }], [52.56, { expr: "flat", facing: 0 }], [54.5, { facing: 1, expr: "neutral" }]]);
      if (t < 50.8 || t > 54.5) st = typing(st, t);
    }
    if (s !== "forum") out.push({ c: LASZLO, pos: [76.85, HOUSE.floor + 0.4, -20.1], st, blob: false }); // forum = screen insert, he is off-frame there
    if (s === "dinner") out.push(buck(t, 75.4, -18.4, [[28.9, { facing: 1, expr: "neutral" }], [31.9, { R: "point", expr: "flat" }], [34.5, { R: "down" }]]));
    if (s === "game" || s === "forum") out.push(buck(t, 80.35, -18.15, [[48, { facing: -1, expr: "neutral" }], [49.1, { L: "pointUp", expr: "flat" }], [50.6, { L: "down" }],
      [52.56, { L: "shrug", R: "shrug", expr: "flat", facing: 0 }], [53.9, { L: "point", R: "down", facing: -1, expr: "neutral" }]]));
  }
  if (s === "y2010") {
    out.push(buck(t, STAND[0] + 1.35, -6.2, [[43, { L: "present", facing: -1, expr: "smile" }], [45.2, { L: "down", expr: "flat", facing: 0 }], [46.6, { L: "shrug", R: "shrug" }], [47.5, { L: "down", R: "down" }]]));
    out.push(walker(extra(2), t, [[43, 9.5, -4.7], [48, 31, -4.7]]));
    out.push(walker(extra(5), t, [[43, 29.5, -4.9], [45.1, 21.8, -4.9], [46.9, 21.8, -4.9], [48, 17.6, -4.9]], { expr: "flat", L: "shrug", R: "shrug", facing: -1 }));
    out.push(walker(extra(7), t, [[43, 3, -4.4], [44.4, 3, -4.4], [48, 18, -4.4]]));
    out.push(walker(extra(9), t, [[43, 36, 5.4], [48, 22, 5.4]]));
  }
  return out;
};

// ---------------- big numbers (exactly as said in the VO) ----------------
export const TEXTS = [
  { a: 0.0, b: 1.95, s: "MAY 22, 2025", y: 70, size: 70, col: "#ffffff" },
  { a: 0.33, b: 2.6, s: "$1,100,000,000", y: 760, size: 150, col: "#FFD21F", slam: true },
  { a: 4.86, b: 6.55, s: "2 PIZZAS", y: 90, size: 150, col: "#FFD21F", slam: true },
  { a: 11.28, b: 12.9, s: "15 YEARS EARLIER", y: 80, size: 110, col: "#ffffff", slam: true },
  { a: 19.36, b: 22.85, s: "$1.1 BILLION", y: 90, size: 180, col: "#FFD21F", slam: true },
  { a: 41.7, b: 43.0, s: "2010", y: 330, size: 260, col: "#FFD21F", slam: true },
  { a: 44.2, b: 46.3, s: "1 YEAR OLD", y: 80, size: 120, col: "#ffffff", slam: true },
];
export const FLASH_AT = [40.75]; // white whoosh flash into the rewind
