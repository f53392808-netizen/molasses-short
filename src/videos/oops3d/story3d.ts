// Oopsonomics ep01, FULL 3D episode (653.6 s). One town (world3d.ts + town.ts + sets3d.ts); shots = camera + who stands where.
// Everything is a pure function of time t (s) = frame / 30. Shots before 58.2 s come from the approved test (new street-level hook);
// later shots use auto-framing cameras (azimuth/height/fov; distance solved so every framed character fits, then a slow push).
import { WORDS } from "./words";
import { ARM, act, CharState, CharDef, BUCK, LASZLO, DRIVER, JEREMY, extra } from "../oops/cast";

export const FPS = 30;
export const TOTAL = 19607; // 653.57 s (audio 653.58 s)
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

(ARM as any).holdHigh = { e: [30, 26], h: [-2, 30], front: true };
(ARM as any).cheer = { e: [30, -30], h: [34, -78], open: true };
(ARM as any).eat = { e: [22, 30], h: [-20, -14], front: true };
(ARM as any).cross = { e: [26, 40], h: [-14, 40], front: true };
(ARM as any).whisper = { e: [26, 10], h: [10, -30], front: true };

export const COOK: CharDef = { name: "cook", seed: 57, o: { jacket: "#f4efe6", pants: "#3a3a44", boots: "#241a18", hat: "cap", cap: "#c8363a", skin: "#d9a67c", top: "polo" } } as any;
export const HOLDER = extra(6);

// ---------------- places (m) ----------------
export const BUCK_HOOK: V3 = [-50, 0.15, -5.6];
export const PEDESTAL: V3 = [-44.3, 0.08, -9.6];
export const DOOR_X = 74, HOUSE = { x0: 67, x1: 81, z0: -21, z1: -11, h: 3.2, floor: 0.25 };
export const SHOP = { x0: 35, x1: 47, z0: -22, z1: -12 };
export const JROOM = { x0: 100, x1: 110, z0: 12, z1: 21 };
export const LOT = { drum: [-8, 0, 32] as V3, clock: [4, 0, 36] as V3, cpu: [-19, 0, 22] as V3, gpu: [6, 0, 22] as V3, tables: [[-14, 18], [-10, 18], [-6, 18], [-14, 23], [-10, 23], [-6, 23]] as [number, number][] };
export const CH = { x0: 130, x1: 231, z: -30 };
export const yr2x = (y: number) => CH.x0 + (y - 2010.3) * (CH.x1 - CH.x0) / 15.1;
const PRICE: [number, number][] = [[2010.3, 0.003], [2010.6, 0.06], [2010.9, 0.25], [2011.12, 1.0], [2011.45, 30], [2011.9, 2.5], [2012.5, 7], [2013.3, 110], [2013.6, 90], [2013.92, 1000], [2014.2, 600], [2015.0, 220], [2016.0, 430], [2016.9, 900], [2017.5, 2500], [2017.96, 19500], [2018.3, 8000], [2018.95, 3400], [2019.5, 11000], [2020.2, 5000], [2020.95, 29000], [2021.3, 58000], [2021.55, 32000], [2021.85, 67000], [2022.5, 20000], [2022.9, 16000], [2023.9, 42000], [2024.2, 70000], [2024.6, 58000], [2024.95, 98000], [2025.4, 110000]];
export const logPrice = (y: number) => {
  const P = PRICE; if (y <= P[0][0]) return Math.log10(P[0][1]); if (y >= P[P.length - 1][0]) return Math.log10(P[P.length - 1][1]);
  let i = 0; while (y > P[i + 1][0]) i++;
  const L = (j: number) => Math.log10(P[Math.max(0, Math.min(P.length - 1, j))][1]), T = (j: number) => P[Math.max(0, Math.min(P.length - 1, j))][0];
  const u = (y - T(i)) / (T(i + 1) - T(i)), h = T(i + 1) - T(i);
  const m0 = (L(i + 1) - L(i - 1)) / Math.max(1e-3, T(i + 1) - T(i - 1)) * 0.6, m1 = (L(i + 2) - L(i)) / Math.max(1e-3, T(i + 2) - T(i)) * 0.6;
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return h00 * L(i) + h10 * h * m0 + h01 * L(i + 1) + h11 * h * m1;
};
export const chartH = (x: number) => 1.0 + 3.6 * (logPrice(2010.3 + (x - CH.x0) * 15.1 / (CH.x1 - CH.x0)) + 2.6);
export const CRT: { pos: V3; yaw: number } = { pos: [78.25, 1.03, -20.3], yaw: -0.75 };
export const SCREEN_C: V3 = [CRT.pos[0] + Math.sin(CRT.yaw) * 0.232, CRT.pos[1] + 0.26, CRT.pos[2] + Math.cos(CRT.yaw) * 0.232];
const scr = (d: number, dy = 0, da = 0.45): V3 => [SCREEN_C[0] + Math.sin(CRT.yaw + da) * d, SCREEN_C[1] + dy, SCREEN_C[2] + Math.cos(CRT.yaw + da) * d];
export const LAP_C: V3 = [105.0, 1.19, 17.62];
export const STAND: V3 = [20, 0.15, -5.9];
export const groundY = (x: number, z: number) => {
  if (x > HOUSE.x0 && x < HOUSE.x1 && z > HOUSE.z0 && z < HOUSE.z1) return HOUSE.floor;
  if (x > 72 && x < 76 && z >= HOUSE.z1 && z < -9.6) return 0.25;
  if (x > -66 && x < -34 && z > -26 && z < -7) { if (x > -58 && x < -42 && z > -25.6 && z < -21.6) return 1.04; return 0.08; }
  if (x > SHOP.x0 && x < SHOP.x1 && z > SHOP.z0 && z < SHOP.z1) return 0.1;
  if (x > JROOM.x0 && x < JROOM.x1 && z > JROOM.z0 && z < JROOM.z1) return 0.2;
  if (x > -26 && x < 16 && z > 8 && z < 46) return 0.08;
  if (x > 115 && x < 248 && z > -70 && z < -8) return 0.08;
  const a = Math.abs(z);
  return a < 4 ? 0.02 : a < 7 ? 0.15 : 0;
};

// ---------------- shots ----------------
type Key = [number, V3, V3, number?];
export type Cam = { az0: number; az1: number; h?: number; fov?: number; push?: number; ly?: number; minD?: number };
export type Shot = { id: string; a: number; b: number; keys?: Key[]; cam?: Cam; inside?: string; shadow: number; traffic?: number; who?: (t: number) => Who[]; scr?: string; dof?: number; lap?: string };
// ---------------- who helpers ----------------
export type Who = { c: CharDef; pos: V3; st: CharState; dir?: [number, number]; sq?: number; k?: number; blob?: boolean; hd?: number; lie?: boolean; nf?: boolean };
const at = (x: number, z: number, dy = 0): V3 => [x, groundY(x, z) + dy, z];
export const face = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);
const angBlend = (a: number, b: number, u: number) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * u; };
const ch = (t: number, c: CharDef, x: number, z: number, keys: [number, CharState][], hd?: number, o: Partial<Who> = {}): Who => ({ c, pos: at(x, z), st: act(t, [[-9, { prop: null }], ...keys]), hd, ...o });
const sitAt = (t: number, c: CharDef, p: V3, keys: [number, CharState][], typeUntil = -1, o: Partial<Who> = {}): Who => {
  let st = act(t, [[-9, { mode: "sit", prop: null }], ...keys]); st = { ...st, mode: "sit" };
  if (t < typeUntil) st = typing(st, t);
  return { c, pos: p, st, blob: false, ...o };
};
type PK = [number, number, number];
export const walk = (t: number, pts: PK[]) => {
  let dist = 0, x = pts[0][1], z = pts[0][2], moving = false, dx = 0, dz = 0, tStop = -99;
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, x0, z0] = pts[i], [t1, x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0);
    if (t >= t1) { dist += L; x = x1; z = z1; if (L > 0.01) { dx = x1 - x0; dz = z1 - z0; tStop = t1; } continue; }
    if (t > t0) { const u = (t - t0) / (t1 - t0); x = lerp(x0, x1, u); z = lerp(z0, z1, u); dist += L * u; moving = L > 0.01; if (L > 0.01) { dx = x1 - x0; dz = z1 - z0; } }
    else if (L > 0.01 && dx === 0 && dz === 0) { dx = x1 - x0; dz = z1 - z0; }
    break;
  }
  return { x, z, moving, phase: dist / 1.45, dx, dz, sq: 1, tStop };
};
/** walker: side/front/back walk chosen by the renderer from the heading; heading smoothed over +-0.22 s (turns are rotations, not pops) */
const wk = (t: number, c: CharDef, pts: PK[], st: CharState = {}, endHd?: number, o: Partial<Who> = {}): Who => {
  const w = walk(t, pts), a = walk(t - 0.22, pts), b = walk(t + 0.22, pts);
  let hd = Math.atan2(w.dx, w.dz);
  if (Math.hypot(b.x - a.x, b.z - a.z) > 0.05) hd = Math.atan2(b.x - a.x, b.z - a.z);
  if (!w.moving && endHd !== undefined && t >= w.tStop) hd = angBlend(hd, endHd, smooth((t - w.tStop) / 0.5));
  const base = act(t, [[-9, { prop: null }], [-8, st]]);
  return { c, pos: at(w.x, w.z), st: { ...base, mode: w.moving ? "stroll" : "stand", phase: w.phase }, dir: [w.dx, w.dz], hd, ...o };
};
const typing = (st: CharState, t: number) => {
  const A = ARM.type, o = Math.sin(t * 22), o2 = Math.sin(t * 19 + 1.3);
  return { ...st, armL: { ...A, h: [A.h[0], A.h[1] - 5 * Math.max(0, o)] }, armR: { ...A, h: [A.h[0], A.h[1] - 5 * Math.max(0, o2)] } } as CharState;
};
const F = HOUSE.floor, LZSEAT: V3 = [76.85, F + 0.4, -20.1], JSEAT: V3 = [105.0, 0.62, 18.95];
const lzDesk = (t: number, keys: [number, CharState][], typeUntil = -1) => sitAt(t, LASZLO, LZSEAT, [[0, { facing: 1, expr: "neutral" }], ...keys], typeUntil);
const jDesk = (t: number, keys: [number, CharState][], typeUntil = -1) => sitAt(t, JEREMY, JSEAT, [[0, { expr: "neutral" }], ...keys], typeUntil);
const buckAt = (t: number, x: number, z: number, keys: [number, CharState][], hd?: number) => ch(t, BUCK, x, z, [[0, { expr: "neutral" }], ...keys], hd);
/** host walk: Buck strolls along the north sidewalk (z 5.5) at 1.1 m/s; two passers-by behind him on the lawn edge */
const host = (a: number, b: number, x0: number, dir: number, keys: [number, CharState][] = []) => (t: number): Who[] => {
  const x1 = x0 + dir * 1.1 * (b - a + 0.6);
  const out = [wk(t, BUCK, [[a - 0.3, x0, 5.5], [b + 0.3, x1, 5.5]], act(t, [[0, { expr: "neutral" }], ...keys]))];
  const xs = x0 + dir * 9;
  out.push(wk(t, extra(3 + (Math.round(x0) & 3)), [[a - 1, xs, 6.5], [b + 1, xs - dir * 1.3 * (b - a + 2), 6.5]], {}, undefined, { nf: true, k: 0.97 }));
  out.push(wk(t, extra(8 + (Math.round(x0) & 1)), [[a - 1, x0 - dir * 6, 6.6], [b + 1, x0 - dir * 6 + dir * 0.8 * (b - a + 2), 6.6]], {}, undefined, { nf: true, k: 0.95 }));
  return out;
};
const hostCam = (dir: number): Cam => ({ az0: Math.atan2(dir * 0.9, -0.42), az1: Math.atan2(dir * 0.75, -0.66), h: 0.35, fov: 40, push: 0.1 });
const crowd2025 = (t: number, n = 10, cx = -52, cz = -11.5, faceHd?: number): Who[] => {
  const out: Who[] = [];
  for (let i = 0; i < n; i++) {
    const x = cx - 4.5 + (i % 5) * 2.4 + (i > 4 ? 1.1 : 0), z = cz + (i > 4 ? -3.2 : 0) - (i % 2) * 0.8, ph = t * 2.6 + i * 1.7;
    const st: CharState = { expr: (["laugh", "grin", "wide", "smile"] as const)[i % 4] };
    st.armL = mixA(ARM.wave, (ARM as any).cheer, 0.5 + 0.5 * Math.sin(ph)) as any; st.armR = mixA((ARM as any).cheer, ARM.wave, 0.5 + 0.5 * Math.sin(ph + 1)) as any;
    if (i % 4 === 3) { st.prop = "slice"; st.armR = (ARM as any).eat; }
    out.push({ c: extra(i), pos: at(x, z, 0.12 * Math.max(0, Math.sin(ph * 1.3))), st, k: 0.92, nf: true, hd: faceHd });
  }
  return out;
};
const mixA = (a: any, b: any, u: number) => ({ e: [lerp(a.e[0], b.e[0], u), lerp(a.e[1], b.e[1], u)], h: [lerp(a.h[0], b.h[0], u), lerp(a.h[1], b.h[1], u)], front: u < 0.5 ? a.front : b.front, open: true });
const rideP = (t: number, yr: number): V3 => { const x = yr2x(yr); return [x, chartH(x) + 0.5, CH.z]; };
const rider = (t: number, c: CharDef, keys: [number, CharState][]): Who => { const y = riderYear(t) ?? 2010.4; return { c, pos: rideP(t, y), st: act(t, [[-9, { prop: null }], ...keys]), blob: false }; };
const COOKP = (t: number, keys: [number, CharState][] = []) => ch(t, COOK, 41.2, -18.2, [[0, { expr: "neutral" }], ...keys]);
const OFF = (az0: number, az1: number, h = 0.25, fov = 42): Cam => ({ az0, az1, h, fov, push: 0.08 });
const crtK = (a: number, b: number, d0 = 1.5, d1 = 0.78): Key[] => [[a, scr(d0, 0.18, 0.75), SCREEN_C, 40], [b, scr(d1, 0.04, 0.5), SCREEN_C, 38]];
const lapK = (a: number, b: number): Key[] => [[a, [106.1, 1.75, 19.7], LAP_C, 40], [b, [105.7, 1.6, 19.0], LAP_C, 36]];

const buck = (t: number, x: number, z: number, keys: [number, CharState][]): Who => ({ c: BUCK, pos: at(x, z), st: act(t, [[-9, { prop: null }], ...keys]) });
const walker = (c: CharDef, t: number, pts: PK[], st: CharState = {}, endHd?: number): Who => wk(t, c, pts, st, endHd);
const BUCK_HOOK_ = BUCK_HOOK;
export const SHOTS: Shot[] = [
  // ===== 0-58.2: approved test shots, new street-level hook =====
  { id: "hook", a: 0, b: 2.6, shadow: 40, traffic: 2, keys: [
    [0.0, [-66, 1.75, -0.4], [-40, 1.6, -0.2], 46], [0.18, [-61.5, 1.72, -0.5], [-44, 1.5, -1.6], 45], [0.34, [-57.4, 1.68, -0.4], [-50, 1.42, -5.6], 42],
    [1.3, [-54.6, 1.66, -1.0], [-50, 1.4, -5.7], 40], [2.6, [-52.6, 1.62, -1.6], [-50, 1.38, -5.8], 38]] },
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
  { id: "dinner", a: 28.9, b: 35.1, shadow: 25, inside: "house", keys: [
    [28.9, [75.2, 1.65, -13.2], [77.5, 1.05, -19.3], 44], [32.0, [76.4, 1.5, -14.6], [77.6, 1.05, -19.4], 44], [35.1, [77.4, 1.5, -15.5], [77.8, 1.08, -19.5], 44]] },
  { id: "coin", a: 35.1, b: 40.75, shadow: 25, inside: "house", keys: [
    [35.1, [79.6, 1.4, -16.2], [77.6, 1.0, -19.8], 44], [37.6, [79.2, 1.35, -16.5], [77.8, 1.15, -19.9], 44], [40.75, [78.9, 1.2, -16.6], [77.9, 1.75, -19.9], 46]] },
  { id: "rewind", a: 40.75, b: 43.0, shadow: 60, keys: [
    [40.75, [73.5, 4.5, -2], [75, 2, -14], 46], [41.7, [62, 9, 6], [48, 1.5, -6], 50], [43.0, [36, 11, 8], [20, 1, -6], 50]] },
  { id: "y2010", a: 43.0, b: 48.0, shadow: 30, keys: [
    [43.0, [13.6, 1.8, 2.6], [19, 1.2, -5.5], 42], [45.5, [17.6, 1.6, 1.6], [20.6, 1.1, -5.6], 42], [48.0, [22.6, 1.9, 1.7], [20.8, 1.15, -5.7], 42]] },
  { id: "game", a: 48.0, b: 53.75, shadow: 25, inside: "house", keys: [
    [48.0, [76.2, 1.7, -14.6], [78.5, 1.15, -19.3], 44], [51.0, [77.6, 1.55, -15.2], [78.9, 1.15, -19.5], 44], [53.75, [79.2, 1.55, -15.6], [79.1, 1.15, -19.6], 44]] },
  { id: "forum", a: 53.75, b: 58.21, shadow: 25, inside: "house", keys: [
    [53.75, scr(2.1, 0.3, 0.9), SCREEN_C, 44], [56.0, scr(1.25, 0.12, 0.7), SCREEN_C, 42], [58.21, scr(0.72, 0.02, 0.5), SCREEN_C, 40]] },
  // ===== 58.2- : full episode =====
  { id: "fans", a: 58.21, b: 63.6, shadow: 25, cam: { az0: 0.55, az1: 0.15, h: 0.4, fov: 42 }, who: (t) => [
    ch(t, extra(2), 14.6, -5.3, [[0, { prop: "laptop", L: "hold", R: "hold", expr: "neutral" }], [59.3, { expr: "smile" }]], face(14.6, -5.3, 16, -4)),
    ch(t, extra(4), 16.0, -5.6, [[0, { prop: "laptop", L: "hold", R: "hold", expr: "flat" }], [60.2, { expr: "o" }]]),
    ch(t, extra(5), 17.4, -5.2, [[0, { prop: "coin", R: "coin", expr: "grin" }]], face(17.4, -5.2, 16, -4.5)),
    ch(t, extra(9), 18.8, -5.6, [[0, { expr: "content", R: "chin" }], [61.6, { headTilt: -8, look: 1 }]]),
    buckAt(t, 12.6, -4.6, [[58.3, { R: "present", expr: "smile" }], [61.0, { R: "down" }]], face(12.6, -4.6, 15, -3)) ] },
  { id: "lzintro", a: 63.6, b: 67.6, shadow: 25, inside: "house", cam: OFF(0.45, 0.1, 0.15, 40), who: (t) => [
    lzDesk(t, [[64.8, { expr: "smile", R: "wave" }], [66.3, { R: "down", L: "down" }]], 64.7)] },
  { id: "pioneer", a: 67.6, b: 71.0, shadow: 25, inside: "house", cam: OFF(-0.3, 0.05, 0.3, 42), who: (t) => [
    ch(t, LASZLO, 79.6, -18.9, [[0, { expr: "neutral", R: "hip", L: "hip" }], [69.9, { expr: "grin", tilt: -3 }]]),
    buckAt(t, 76.4, -17.6, [[67.7, { R: "present" }], [69.8, { R: "down", expr: "flat" }]], face(76.4, -17.6, 79.6, -18.9))] },
  { id: "mined", a: 71.0, b: 76.1, shadow: 40, cam: { az0: Math.PI + 0.45, az1: Math.PI + 0.1, h: 1.6, fov: 44, minD: 9 }, who: (t) => [
    ...LOT.tables.map(([x, z], i) => sitAt(t, extra(12 + i), [x, 0.05 + 0.4, z + 0.62], [[0, { facing: 0, expr: (["neutral", "flat", "o"] as const)[i % 3] }]], 999, { k: 0.95, nf: i !== 1 && i !== 4 })),
    buckAt(t, -3.2, 16.6, [[71.2, { L: "present", expr: "neutral" }], [74.2, { L: "pointUp" }], [75.4, { L: "down" }]], face(-3.2, 16.6, -9, 20))] },
  { id: "cpu", a: 76.1, b: 80.0, shadow: 25, cam: { az0: Math.PI - 0.5, az1: Math.PI - 0.15, h: 0.35, fov: 40 }, who: (t) => [
    sitAt(t, extra(1), [LOT.cpu[0], 0.45, LOT.cpu[2] + 0.62], [[0, { expr: "flat", R: "chin" }], [78.6, { expr: "o" }]], -1),
    buckAt(t, LOT.cpu[0] + 1.9, LOT.cpu[2] - 0.6, [[76.3, { L: "point", expr: "neutral" }], [79.0, { L: "down" }]], face(LOT.cpu[0] + 1.9, LOT.cpu[2] - 0.6, LOT.cpu[0], LOT.cpu[2]))] },
  { id: "gpucard", a: 80.0, b: 84.2, shadow: 25, inside: "house", cam: OFF(0.4, 0.0, 0.3, 40), who: (t) => [
    ch(t, LASZLO, 77.6, -18.9, [[0, { expr: "neutral", prop: "gpu" as any, R: "coin", L: "down" }], [81.6, { expr: "grin", R: "holdHigh" as any }], [83.2, { R: "hold" }]]),
    buckAt(t, 79.9, -17.9, [[80.4, { expr: "flat" }], [82.3, { L: "point" }], [83.6, { L: "down" }]], face(79.9, -17.9, 77.6, -18.9))] },
  { id: "gpufast", a: 84.2, b: 88.0, shadow: 25, inside: "house", cam: OFF(-0.35, -0.05, 0.2, 40), scr: "hash", who: (t) => [
    lzDesk(t, [[84.2, { expr: "o", facing: 1 }], [86.0, { expr: "grin" }]], 85.8)] },
  { id: "credited", a: 88.0, b: 90.75, shadow: 25, inside: "house", cam: OFF(0.2, -0.15, 0.3, 42), who: (t) => [
    ch(t, LASZLO, 78.4, -18.8, [[0, { expr: "content", L: "down", R: "down" }], [89.0, { expr: "smile", R: "thumb" }]]),
    buckAt(t, 76.2, -17.7, [[88.2, { R: "present", expr: "neutral" }], [90.0, { R: "down" }]], face(76.2, -17.7, 78.4, -18.8))] },
  { id: "lottery", a: 90.75, b: 95.4, shadow: 60, traffic: 1, cam: { az0: Math.PI + 0.7, az1: Math.PI + 0.25, h: 4.5, fov: 46, minD: 13, ly: 2.5 }, who: (t) => [
    buckAt(t, LOT.drum[0] + 3.4, LOT.drum[2] - 4.5, [[91.0, { L: "present", expr: "neutral" }], [93.2, { L: "pointUp" }], [94.6, { L: "down" }]], face(LOT.drum[0] + 3.4, LOT.drum[2] - 4.5, LOT.drum[0], LOT.drum[2]))] },
  { id: "race", a: 95.4, b: 99.0, shadow: 40, cam: { az0: Math.PI - 0.4, az1: Math.PI - 0.05, h: 1.2, fov: 42, minD: 7 }, who: (t) =>
    LOT.tables.map(([x, z], i) => sitAt(t, extra(12 + i), [x, 0.45, z + 0.62], [[0, { facing: 0, expr: i % 2 ? "o" : "flat" }]], 999, { k: 0.95, nf: i > 2 })) },
  { id: "winner", a: 99.0, b: 102.3, shadow: 40, cam: { az0: Math.PI + 0.3, az1: Math.PI + 0.6, h: 0.9, fov: 42 }, who: (t) => [
    ch(t, extra(13), LOT.drum[0] + 3.0, LOT.drum[2] - 2.6, [[0, { expr: "o", L: "down", R: "down" }], [99.3, { expr: "laugh", L: (("cheer" as any)), R: ("cheer" as any) }], [101.0, { L: "down", R: "coin", prop: "coin", expr: "grin" }]]),
    buckAt(t, LOT.drum[0] + 5.0, LOT.drum[2] - 3.4, [[99.5, { expr: "flat", R: "point" }], [101.4, { R: "down" }]], face(LOT.drum[0] + 5.0, LOT.drum[2] - 3.4, LOT.drum[0] + 3, LOT.drum[2] - 2.6))] },
  { id: "chances", a: 102.3, b: 106.7, shadow: 40, cam: { az0: Math.PI - 0.6, az1: Math.PI - 0.95, h: 1.0, fov: 42, minD: 6 }, who: (t) => [
    ...LOT.tables.slice(0, 3).map(([x, z], i) => sitAt(t, extra(12 + i), [x, 0.45, z + 0.62], [[0, { facing: 0, expr: "flat" }]], 999, { k: 0.95 })),
    buckAt(t, -2.6, 19.0, [[102.5, { L: "present", expr: "neutral" }], [104.6, { L: "down", R: "pointUp" }], [106.0, { R: "down" }]], face(-2.6, 19.0, -6, 19))] },
  { id: "oneperson", a: 106.7, b: 110.4, shadow: 25, cam: { az0: Math.PI + 0.35, az1: Math.PI + 0.05, h: 0.25, fov: 38 }, who: (t) => [
    sitAt(t, extra(1), [LOT.cpu[0], 0.45, LOT.cpu[2] + 0.62], [[0, { expr: "flat", R: "chin" }], [108.2, { expr: "o", headTilt: -6 }], [109.4, { expr: "flat", headTilt: 0 }]], -1)] },
  { id: "workers", a: 110.4, b: 115.3, shadow: 60, cam: { az0: Math.PI + 0.2, az1: Math.PI - 0.25, h: 3.0, fov: 44, minD: 11, ly: 1.0 }, who: (t) => [
    buckAt(t, LOT.gpu[0] - 4.6, LOT.gpu[2] - 5.4, [[110.6, { L: "present", expr: "neutral" }], [112.4, { expr: "flat" }], [114.4, { L: "down" }]], face(LOT.gpu[0] - 4.6, LOT.gpu[2] - 5.4, LOT.gpu[0], LOT.gpu[2]))] },
  { id: "mac", a: 115.3, b: 120.6, shadow: 25, inside: "house", cam: OFF(0.35, -0.1, 0.2, 40), scr: "code", who: (t) => [
    lzDesk(t, [[117.6, { expr: "smile", facing: 0, R: "wave" }], [118.6, { R: "down", facing: 1 }]], 117.4),
    buckAt(t, 75.0, -18.0, [[115.5, { expr: "neutral", R: "present" }], [118.0, { R: "down" }]], face(75, -18, 76.85, -20.1))] },
  { id: "thousands", a: 120.6, b: 124.6, shadow: 25, inside: "house", cam: OFF(0.55, 0.25, 0.25, 42), scr: "hash", who: (t) => [
    lzDesk(t, [[121.4, { expr: "o" }], [122.6, { expr: "grin", facing: 0 }]], 121.2),
    buckAt(t, 74.8, -17.7, [[121.0, { R: "point", expr: "flat" }], [123.4, { R: "down" }]], face(74.8, -17.7, 76, -19.1))] },
  { id: "pct", a: 124.6, b: 129.8, shadow: 25, traffic: 1, cam: hostCam(1), who: host(124.6, 129.8, -124, 1, [[126.0, { R: "pointUp" }], [128.2, { R: "down" }]]) },
  { id: "problem", a: 129.8, b: 133.7, shadow: 25, inside: "shop", cam: { az0: 0.55, az1: 0.25, h: 0.3, fov: 40 }, who: (t) => [
    COOKP(t, [[131.6, { expr: "flat", L: "cross" as any, R: "cross" as any }]]),
    ch(t, LASZLO, 40.0, -15.4, [[0, { expr: "smile", R: "coin", prop: "coin" }], [132.4, { expr: "flat" }]], face(40, -15.4, 41.2, -18.2))] },
  { id: "think", a: 133.7, b: 137.0, shadow: 25, traffic: 1, cam: hostCam(-1), who: host(133.7, 137.0, -16, -1, [[134.8, { R: "pointUp", expr: "neutral" }], [136.3, { R: "down" }]]) },
  { id: "paper", a: 137.0, b: 140.6, shadow: 25, inside: "shop", cam: { az0: -0.5, az1: -0.2, h: 0.3, fov: 40 }, who: (t) => [
    COOKP(t, [[137.6, { expr: "flat" }]]),
    ch(t, BUCK, 41.8, -15.4, [[0, { prop: "note", R: "coin", expr: "neutral" }], [138.2, { prop: "coin", expr: "flat" }], [139.6, { R: "down", prop: null }]], face(41.8, -15.4, 41.2, -18.2))] },
  { id: "real", a: 140.6, b: 144.1, shadow: 25, inside: "shop", cam: { az0: 0.25, az1: 0.55, h: 0.25, fov: 40 }, who: (t) => [
    COOKP(t, [[140.8, { expr: "smile", R: "present" }], [142.6, { R: "down" }]]),
    ch(t, BUCK, 40.2, -15.4, [[0, { expr: "neutral" }], [142.6, { prop: "slice", R: "eat" as any, expr: "content" }]], face(40.2, -15.4, 41.2, -18.2))] },
  { id: "nobody", a: 144.1, b: 146.3, shadow: 25, inside: "shop", cam: { az0: 0.1, az1: -0.2, h: 0.3, fov: 40 }, who: (t) => [
    COOKP(t, [[0, { expr: "flat", L: "cross" as any, R: "cross" as any }]]),
    ch(t, LASZLO, 40.6, -15.3, [[0, { expr: "flat", R: "coin", prop: "coin" }]], face(40.6, -15.3, 41.2, -18.2))] },
  { id: "sandwich", a: 146.3, b: 149.3, shadow: 25, cam: { az0: 0.6, az1: 0.35, h: 0.3, fov: 40 }, who: (t) => [
    ch(t, extra(10), 7.0, -7.15, [[0, { expr: "neutral" }], [147.8, { expr: "flat", R: "cross" as any, L: "cross" as any }]]),
    ch(t, LASZLO, 8.5, -5.0, [[0, { expr: "smile", R: "coin", prop: "coin" }], [148.2, { expr: "flat" }]], face(8.5, -5.0, 7.0, -7.0))] },
  { id: "sock", a: 149.3, b: 152.0, shadow: 25, cam: { az0: -0.45, az1: -0.2, h: 0.3, fov: 40 }, who: (t) => [
    ch(t, extra(11), 12.5, -7.15, [[0, { expr: "neutral" }], [150.4, { expr: "flat", R: "cross" as any, L: "cross" as any }]]),
    wk(t, LASZLO, [[149.3, 9.6, -5.0], [150.6, 11.2, -5.0]], { prop: "coin", R: "coin", expr: "neutral" }, face(11.2, -5, 12.5, -7))] },
  { id: "hungry", a: 152.0, b: 156.7, shadow: 25, inside: "house", cam: OFF(-0.4, 0.0, 0.25, 40), scr: "forum", who: (t) => [
    lzDesk(t, [[152.9, { expr: "flat", R: "chin" }], [154.6, { expr: "o", headTilt: -5 }], [155.6, { expr: "grin", headTilt: 0, R: "down" }]], -1)] },
  { id: "may18", a: 156.7, b: 161.3, shadow: 25, inside: "house", keys: crtK(156.7, 161.3), scr: "newpost" },
  { id: "quote1", a: 161.3, b: 164.6, shadow: 25, inside: "house", cam: OFF(0.35, 0.15, 0.15, 38), scr: "post", who: (t) => [lzDesk(t, [[161.3, { facing: 0, expr: "neutral" }], [163.4, { R: "present" }]])] },
  { id: "post", a: 164.6, b: 168.0, shadow: 25, inside: "house", keys: crtK(164.6, 168.0, 1.0, 0.62), scr: "post" },
  { id: "toppings", a: 168.0, b: 171.7, shadow: 25, inside: "shop", keys: [[168.0, [40.9, 2.0, -15.2], [40.2, 1.12, -16.8], 40], [171.7, [39.6, 1.75, -15.6], [40.2, 1.12, -16.8], 38]] },
  { id: "toppings2", a: 171.7, b: 175.3, shadow: 25, inside: "shop", cam: { az0: 0.6, az1: 0.25, h: 0.5, fov: 40 }, who: (t) => [
    COOKP(t, [[0, { expr: "smile", R: "present" }], [173.6, { R: "pointUp", expr: "flat" }]]),
    buckAt(t, 39.0, -15.2, [[171.8, { expr: "neutral" }], [173.6, { L: "pointUp" }], [175.0, { L: "down" }]], face(39, -15.2, 40.2, -16.8))] },
  { id: "fish", a: 175.3, b: 178.45, shadow: 25, inside: "house", cam: OFF(0.3, 0.05, 0.2, 38), scr: "fish", who: (t) => [lzDesk(t, [[175.3, { facing: 0, expr: "flat", R: "pointUp" }], [177.6, { R: "down" }]])] },
  { id: "deal", a: 178.45, b: 182.3, shadow: 30, traffic: 1, cam: { az0: 0.35, az1: 0.05, h: 0.9, fov: 44, minD: 7.5, ly: 1.6 }, who: (t) => [
    buckAt(t, 70.3, -5.6, [[178.6, { R: "present", expr: "neutral" }], [181.0, { R: "down" }]], face(70.3, -5.6, 74, -11))] },
  { id: "deal2", a: 182.3, b: 186.45, shadow: 25, cam: { az0: -0.25, az1: 0.1, h: 0.3, fov: 40 }, who: (t) => [
    ch(t, LASZLO, 73.4, -10.3, [[0, { expr: "smile", R: "coin", prop: "coin" }], [184.2, { R: "holdHigh" as any, L: "holdHigh" as any, expr: "grin" }], [185.6, { R: "down", L: "down" }]])] },
  { id: "nothing", a: 186.45, b: 191.5, shadow: 25, inside: "house", cam: OFF(-0.5, 0.4, 0.3, 42), scr: "empty", who: (t) => [lzDesk(t, [[186.5, { expr: "neutral", R: "chin" }], [188.6, { expr: "flat" }], [190.6, { headTilt: 6 }]])] },
  { id: "math", a: 191.5, b: 196.1, shadow: 25, inside: "house", keys: crtK(191.5, 196.1, 1.3, 0.7), scr: "math" },
  { id: "nobodyknew", a: 196.1, b: 200.3, shadow: 25, cam: { az0: 0.4, az1: 0.0, h: 0.4, fov: 42 }, who: (t) => [
    ch(t, extra(2), 14.8, -5.3, [[0, { prop: "laptop", L: "hold", R: "hold", expr: "flat" }], [198.0, { expr: "o" }]]),
    ch(t, extra(4), 16.3, -5.6, [[0, { expr: "flat", R: "chin" }], [197.6, { headTilt: -7 }]]),
    ch(t, extra(9), 17.8, -5.2, [[0, { expr: "neutral", L: "shrug", R: "shrug" }], [198.6, { L: "down", R: "down" }]])] },
  { id: "dayfour", a: 200.3, b: 203.45, shadow: 25, inside: "house", cam: OFF(0.4, 0.15, 0.2, 38), scr: "reply", who: (t) => [lzDesk(t, [[200.3, { expr: "flat" }], [201.6, { expr: "wide", headTilt: -4 }], [202.6, { expr: "grin" }]])] },
  { id: "jercos", a: 203.45, b: 206.9, shadow: 25, inside: "room", cam: { az0: Math.PI + 0.35, az1: Math.PI + 0.1, h: 0.2, fov: 40 }, lap: "forum", who: (t) => [jDesk(t, [[204.0, { expr: "smile", R: "wave" }], [205.6, { R: "down" }]], 203.9)] },
  { id: "jeremy", a: 206.9, b: 210.4, shadow: 25, inside: "room", cam: { az0: Math.PI - 0.4, az1: Math.PI - 0.1, h: 0.3, fov: 42 }, lap: "forum", who: (t) => [jDesk(t, [[206.9, { expr: "content", facing: 0 }], [208.6, { expr: "smile", R: "thumb" }]], -1)] },
  { id: "halfcent", a: 210.4, b: 214.4, shadow: 30, cam: { az0: 0.6, az1: 0.3, h: 0.5, fov: 42, minD: 5 }, who: (t) => [
    ch(t, BUCK, CH.x0 + 2.2, CH.z + 2.8, [[0, { expr: "neutral", L: "point" }], [212.6, { expr: "flat" }], [213.8, { L: "down" }]], face(CH.x0 + 2.2, CH.z + 2.8, CH.x0, CH.z))] },
  { id: "fourty", a: 214.4, b: 218.65, shadow: 25, inside: "shop", cam: { az0: -0.45, az1: -0.15, h: 0.3, fov: 40 }, who: (t) => [
    COOKP(t, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "smile" }]]),
    buckAt(t, 42.2, -15.2, [[214.6, { R: "present", expr: "neutral" }], [216.4, { R: "coin", prop: "coin" }], [218.0, { R: "down", prop: null }]], face(42.2, -15.2, 41.2, -18.2))] },
  { id: "fair", a: 218.65, b: 224.0, shadow: 25, traffic: 1, cam: hostCam(1), who: host(218.65, 224.0, 24, 1, [[219.0, { L: "shrug", R: "shrug", expr: "flat" }], [220.4, { L: "down", R: "down", expr: "neutral" }]]) },
  { id: "florida", a: 224.0, b: 227.55, shadow: 30, cam: { az0: Math.PI + 0.55, az1: Math.PI + 0.25, h: 0.4, fov: 42, minD: 5 }, who: (t) => [
    ch(t, JEREMY, 93.2, 5.6, [[0, { expr: "neutral", R: "point" }], [225.4, { R: "shrug", L: "shrug", expr: "flat" }], [226.6, { R: "down", L: "down", prop: "phone", expr: "smile" }]], face(93.2, 5.6, 91.45, 6.6))] },
  { id: "order", a: 227.55, b: 230.2, shadow: 25, inside: "room", cam: { az0: Math.PI + 0.25, az1: Math.PI - 0.05, h: 0.2, fov: 38 }, lap: "card", who: (t) => [jDesk(t, [[0, { prop: "phone", R: "chin", expr: "neutral" }], [229.0, { expr: "smile" }]])] },
  { id: "shopcall", a: 230.2, b: 233.05, shadow: 25, inside: "shop", cam: { az0: 0.5, az1: 0.15, h: 0.35, fov: 40 }, who: (t) => [COOKP(t, [[0, { prop: "phone", R: "chin", expr: "neutral" }], [231.6, { prop: "boxes", L: "hold", R: "hold", expr: "smile" }]])] },
  { id: "card", a: 233.05, b: 236.6, shadow: 25, inside: "room", keys: lapK(233.05, 236.6), lap: "card", who: (t) => [jDesk(t, [[0, { prop: "card", R: "cardOut", expr: "neutral" }]], -1)] },
  { id: "send", a: 236.6, b: 241.6, shadow: 25, inside: "house", cam: OFF(-0.35, 0.05, 0.25, 40), scr: "send", who: (t) => [lzDesk(t, [[236.6, { expr: "neutral" }], [239.6, { expr: "smile" }]], 239.4)] },
  { id: "fortyone", a: 241.6, b: 245.25, shadow: 25, inside: "room", cam: { az0: Math.PI - 0.3, az1: Math.PI + 0.05, h: 0.25, fov: 40 }, lap: "coins", who: (t) => [jDesk(t, [[241.6, { expr: "neutral" }], [242.6, { expr: "wide" }], [243.8, { expr: "grin", R: "thumb" }]])] },
  { id: "arrive", a: 245.25, b: 249.6, shadow: 30, cam: { az0: 0.75, az1: 0.45, h: 0.5, fov: 42 }, who: (t) => [
    wk(t, DRIVER, [[245.25, 69.6, -5.2], [247.4, 72.6, -9.2]], { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }, face(72.6, -9.2, 73.6, -10.6)),
    ch(t, LASZLO, 73.6, -10.4, [[0, { expr: "smile", L: "down", R: "down" }], [247.6, { expr: "grin", R: "wave" }], [248.8, { R: "down" }]], face(73.6, -10.4, 72.6, -9.2))] },
  { id: "cheese", a: 249.6, b: 255.3, shadow: 25, inside: "house", cam: OFF(0.4, -0.05, 0.15, 38), who: (t) => [lzDesk(t, [[0, { prop: "slice", R: "eat" as any, expr: "content" }], [251.0, { R: "hold" }], [252.4, { R: "eat" as any, expr: "lick" }], [253.8, { R: "hold", expr: "content" }]])] },
  { id: "strange", a: 255.3, b: 258.2, shadow: 25, traffic: 1, cam: hostCam(-1), who: host(255.3, 258.2, 62, -1, [[256.0, { R: "chin", expr: "flat" }], [257.6, { R: "down" }]]) },
  { id: "dollars", a: 258.2, b: 262.05, shadow: 25, inside: "room", cam: { az0: Math.PI + 0.4, az1: Math.PI + 0.1, h: 0.25, fov: 40 }, lap: "card", who: (t) => [jDesk(t, [[0, { prop: "card", R: "cardOut", expr: "neutral" }], [260.4, { expr: "smile" }]])] },
  { id: "network", a: 262.05, b: 266.0, shadow: 40, cam: { az0: Math.PI - 0.2, az1: Math.PI + 0.3, h: 2.2, fov: 44, minD: 8 }, who: (t) =>
    LOT.tables.map(([x, z], i) => sitAt(t, extra(12 + i), [x, 0.45, z + 0.62], [[0, { facing: 0, expr: "flat" }]], 999, { k: 0.95, nf: i % 2 === 1 })) },
  { id: "middle", a: 266.0, b: 269.75, shadow: 30, cam: { az0: 0.15, az1: -0.05, h: 0.5, fov: 42 }, who: (t) => [
    wk(t, LASZLO, [[266.0, 18.6, -5.2], [268.8, 22.5, -5.2]], { prop: "box", L: "hold", R: "hold", expr: "neutral" }, Math.PI / 2),
    wk(t, JEREMY, [[266.0, 28.2, -5.0], [268.8, 24.4, -5.0]], { expr: "smile" }, -Math.PI / 2)] },
  { id: "shake", a: 269.75, b: 274.25, shadow: 30, cam: { az0: 0.55, az1: 0.15, h: 0.3, fov: 40 }, who: (t) => [
    ch(t, LASZLO, 22.5, -5.2, [[0, { prop: "box", L: "hold", R: "hold", expr: "smile" }], [271.6, { expr: "grin" }]], Math.PI / 2),
    ch(t, JEREMY, 24.4, -5.0, [[0, { expr: "smile", R: "present" }], [271.0, { R: "present", expr: "grin" }], [273.2, { R: "down" }]], -Math.PI / 2)] },
  { id: "report", a: 274.25, b: 278.3, shadow: 25, inside: "house", cam: OFF(0.3, 0.05, 0.15, 38), scr: "report", who: (t) => [lzDesk(t, [[274.3, { expr: "smile", facing: 0 }], [276.4, { expr: "grin", R: "present" }]], 275.6)] },
  { id: "reportscr", a: 278.3, b: 282.1, shadow: 25, inside: "house", keys: crtK(278.3, 282.1, 1.0, 0.62), scr: "report" },
  { id: "happyL", a: 282.1, b: 285.6, shadow: 25, inside: "house", cam: OFF(-0.3, 0.05, 0.2, 40), who: (t) => [lzDesk(t, [[0, { prop: "slice", R: "eat" as any, expr: "content" }], [283.6, { R: "hold", expr: "grin" }]])] },
  { id: "happyJ", a: 285.6, b: 288.2, shadow: 25, inside: "room", cam: { az0: Math.PI + 0.3, az1: Math.PI, h: 0.25, fov: 40 }, lap: "coins", who: (t) => [jDesk(t, [[0, { expr: "grin", R: "thumb" }]])] },
  { id: "price", a: 288.2, b: 290.7, shadow: 25, inside: "shop", cam: { az0: 0.2, az1: -0.15, h: 0.4, fov: 40 }, who: (t) => [COOKP(t, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "smile" }]])] },
  { id: "pause", a: 290.7, b: 297.0, shadow: 25, traffic: 1, cam: hostCam(1), who: host(290.7, 297.0, -136, 1, [[292.1, { R: "pointUp", expr: "neutral" }], [293.4, { R: "down" }], [295.0, { L: "present", expr: "smile" }], [296.4, { L: "down" }]]) },
  { id: "freedinner", a: 297.0, b: 300.7, shadow: 25, inside: "house", cam: OFF(0.5, 0.2, 0.25, 42), scr: "hash", who: (t) => [lzDesk(t, [[0, { prop: "slice", R: "eat" as any, expr: "content" }], [298.6, { R: "hold", expr: "smile" }]])] },
  { id: "honest", a: 300.7, b: 304.2, shadow: 25, cam: { az0: 0.3, az1: 0.05, h: 0.3, fov: 38 }, who: (t) => [
    ch(t, BUCK, STAND[0] + 1.3, -5.0, [[0, { expr: "neutral", R: "coin", prop: "coin" }], [302.6, { expr: "flat", R: "present", prop: null }], [303.8, { R: "down" }]])] },
  { id: "comments", a: 304.2, b: 307.7, shadow: 25, cam: { az0: -0.15, az1: 0.05, h: 0.2, fov: 34 }, who: (t) => [ch(t, BUCK, STAND[0] + 1.3, -5.0, [[0, { expr: "neutral" }], [306.2, { expr: "smile", R: "point" }], [307.3, { R: "down" }]])] },
  { id: "keepwatch", a: 307.7, b: 312.45, shadow: 25, traffic: 1, cam: hostCam(1), who: host(307.7, 312.45, 52, 1, [[309.6, { expr: "flat" }], [310.8, { R: "point" }], [311.9, { R: "down" }]]) },
  { id: "neverhear", a: 312.45, b: 316.2, shadow: 30, cam: { az0: 0.5, az1: 0.25, h: 0.6, fov: 42 }, who: (t) => [
    wk(t, DRIVER, [[312.45, 69.0, -4.8], [315.0, 72.6, -9.2]], { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }, face(72.6, -9.2, 73.6, -10.6)),
    ch(t, LASZLO, 73.6, -10.4, [[0, { expr: "grin" }], [315.2, { R: "wave" }]], face(73.6, -10.4, 72.6, -9.2))] },
  { id: "again", a: 316.2, b: 319.7, shadow: 30, cam: { az0: -0.3, az1: -0.05, h: 0.6, fov: 42 }, who: (t) => [
    wk(t, extra(7), [[316.2, 78.5, -4.6], [318.6, 74.6, -9.2]], { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }, face(74.6, -9.2, 73.6, -10.6)),
    ch(t, LASZLO, 73.6, -10.4, [[0, { expr: "grin", R: "wave" }], [317.4, { R: "down" }]], face(73.6, -10.4, 74.6, -9.2))] },
  { id: "again2", a: 319.7, b: 323.3, shadow: 30, cam: { az0: 0.65, az1: 0.35, h: 1.0, fov: 44, minD: 6 }, who: (t) => [
    wk(t, extra(5), [[319.7, 68.8, -5.0], [321.8, 72.4, -9.2]], { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }, face(72.4, -9.2, 73.6, -10.6)),
    ch(t, LASZLO, 73.6, -10.4, [[0, { expr: "content" }], [322.0, { expr: "grin" }]], face(73.6, -10.4, 72.4, -9.2)),
    buckAt(t, 76.6, -7.6, [[320.4, { expr: "flat", L: "point" }], [322.6, { L: "down" }]], face(76.6, -7.6, 73.6, -10.4))] },
  { id: "eightyk", a: 323.3, b: 328.25, shadow: 25, inside: "house", cam: OFF(-0.75, -0.45, 0.3, 42), who: (t) => [
    ch(t, LASZLO, 72.0, -19.4, [[0, { expr: "content", prop: "slice", R: "eat" as any }], [325.6, { R: "hold", expr: "grin" }]]),
    buckAt(t, 74.2, -17.4, [[323.5, { L: "point", expr: "flat" }], [326.8, { L: "down" }]], face(74.2, -17.4, 72, -19.4))] },
  { id: "hundredk", a: 328.25, b: 331.45, shadow: 25, inside: "house", cam: OFF(-0.5, -0.8, 0.2, 40), who: (t) => [ch(t, LASZLO, 72.0, -19.4, [[0, { expr: "neutral", L: "shrug", R: "shrug" }], [330.2, { L: "down", R: "down", expr: "smile" }]])] },
  { id: "closed", a: 331.45, b: 334.0, shadow: 25, inside: "house", keys: crtK(331.45, 334.0, 1.2, 0.7), scr: "closed" },
  { id: "pile", a: 334.0, b: 338.6, shadow: 40, cam: { az0: 0.2, az1: 0.55, h: 2.5, fov: 44, minD: 8, ly: 1.0 }, who: (t) => [
    buckAt(t, 64.6, -5.3, [[334.2, { R: "present", expr: "neutral" }], [336.6, { R: "down", expr: "flat" }]], face(64.6, -5.3, 67, -9.5))] },
  // ===== the chart ride =====
  { id: "c_watch", a: 338.6, b: 340.85, shadow: 60, cam: { az0: -0.7, az1: -0.35, h: 3.5, fov: 46, minD: 14, ly: 2 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }]])] },
  { id: "c_2011", a: 340.85, b: 344.6, shadow: 40, cam: { az0: 0.5, az1: 0.25, h: 0.8, fov: 42, minD: 6 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }], [342.4, { expr: "o" }]])] },
  { id: "c_10k", a: 344.6, b: 350.15, shadow: 40, cam: { az0: -0.35, az1: 0.15, h: 1.2, fov: 42, minD: 7 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "holdHigh" as any, R: "holdHigh" as any, expr: "wide" }], [347.6, { expr: "flat", L: "hold", R: "hold" }]])] },
  { id: "fanciest", a: 350.15, b: 352.65, shadow: 30, traffic: 1, cam: { az0: 0.35, az1: 0.1, h: 0.6, fov: 42, minD: 6, ly: 1.4 }, who: (t) => [buckAt(t, 43.0, -9.6, [[350.3, { prop: "boxes", L: "hold", R: "hold", expr: "flat" }]])] },
  { id: "c_2013", a: 352.65, b: 357.3, shadow: 60, cam: { az0: 0.75, az1: 0.4, h: 2.5, fov: 44, minD: 10 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }], [355.0, { expr: "o" }]])] },
  { id: "c_10m", a: 357.3, b: 361.25, shadow: 40, cam: { az0: -0.2, az1: -0.5, h: 0.6, fov: 40, minD: 6 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "wide" }], [359.6, { expr: "flat" }]])] },
  { id: "buyshop", a: 361.25, b: 364.45, shadow: 60, traffic: 1, keys: [[361.25, [43.5, 2.4, -2.5], [40.5, 2.0, -12], 42], [362.5, [44.5, 3.0, 1.5], [36, 1.6, -9], 46], [364.45, [52, 9, 6], [30, 1, -6], 50]], who: (t) => [buckAt(t, 39.4, -9.4, [[0, { expr: "flat", R: "point" }], [362.8, { R: "down", L: "present" }]])] },
  { id: "c_2017", a: 364.45, b: 369.45, shadow: 60, cam: { az0: 0.45, az1: 0.1, h: 3.0, fov: 44, minD: 10 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }], [366.8, { expr: "o" }]])] },
  { id: "c_200m", a: 369.45, b: 373.75, shadow: 40, cam: { az0: -0.4, az1: -0.1, h: 0.4, fov: 40, minD: 6 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "flat" }], [371.9, { expr: "neutral", headTilt: -5 }]])] },
  { id: "c_2021", a: 373.75, b: 377.55, shadow: 60, cam: { az0: 0.3, az1: 0.65, h: 2.0, fov: 44, minD: 9 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }], [375.6, { expr: "wide" }]])] },
  { id: "c_2025", a: 377.55, b: 381.2, shadow: 60, cam: { az0: -0.6, az1: -0.3, h: 1.5, fov: 44, minD: 9 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }]])] },
  { id: "c_top", a: 381.2, b: 385.05, shadow: 90, cam: { az0: 0.15, az1: 0.45, h: 6, fov: 46, minD: 16, ly: -4 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "holdHigh" as any, R: "holdHigh" as any, expr: "flat" }]])] },
  { id: "c_first2", a: 385.05, b: 388.7, shadow: 40, cam: { az0: 0.2, az1: -0.1, h: 0.4, fov: 38, minD: 5 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }], [386.7, { expr: "flat", tilt: 2 }]])] },
  { id: "c_zero", a: 388.7, b: 392.45, shadow: 90, cam: { az0: -0.5, az1: -0.85, h: 3, fov: 46, minD: 14, ly: -2 }, who: (t) => [rider(t, BUCK, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "flat" }], [390.6, { expr: "wide" }]])] },
  { id: "game2", a: 392.45, b: 397.55, shadow: 25, traffic: 1, cam: hostCam(1), who: host(392.45, 397.55, -84, 1, [[393.2, { L: "shrug", R: "shrug", expr: "flat" }], [394.4, { L: "down", R: "down", expr: "neutral" }], [395.6, { R: "present", expr: "smile" }], [396.9, { R: "down" }]]) },
  { id: "imagine", a: 397.55, b: 402.75, shadow: 25, cam: { az0: 0.55, az1: 0.2, h: 0.35, fov: 40 }, who: (t) => [
    ch(t, HOLDER, STAND[0] - 1.4, -5.0, [[0, { expr: "neutral", R: "coin", prop: "coin" }], [399.8, { expr: "grin", R: "holdHigh" as any }], [401.4, { R: "coin", expr: "content" }]]),
    buckAt(t, STAND[0] + 1.5, -4.8, [[397.8, { L: "present", expr: "neutral" }], [400.6, { L: "down" }]], face(STAND[0] + 1.5, -4.8, STAND[0] - 1.4, -5))] },
  { id: "h_ride", a: 402.75, b: 407.75, shadow: 40, cam: { az0: 0.45, az1: 0.15, h: 1.0, fov: 42, minD: 7 }, who: (t) => [rider(t, HOLDER, [[0, { expr: "neutral", R: "coin", prop: "coin" }], [404.8, { expr: "o" }]])] },
  { id: "h_30", a: 407.75, b: 411.45, shadow: 40, cam: { az0: -0.3, az1: 0.0, h: 0.8, fov: 42, minD: 6 }, who: (t) => [rider(t, HOLDER, [[0, { expr: "wide", R: "coin", prop: "coin" }], [410.1, { expr: "grin", R: "holdHigh" as any }]])] },
  { id: "h_crash", a: 411.45, b: 414.35, shadow: 40, cam: { az0: 0.6, az1: 0.85, h: 2.0, fov: 44, minD: 8 }, who: (t) => [rider(t, HOLDER, [[0, { expr: "grin", R: "holdHigh" as any, prop: "coin" }], [411.9, { expr: "shock", R: "coin" }], [413.4, { expr: "flat" }]])] },
  { id: "h_stack", a: 414.35, b: 419.75, shadow: 40, cam: { az0: -0.15, az1: 0.2, h: 0.5, fov: 40, minD: 6 }, who: (t) => [rider(t, HOLDER, [[0, { expr: "flat", R: "coin", prop: "coin" }], [416.4, { expr: "shock" }], [418.4, { expr: "flat" }]])] },
  { id: "gox", a: 419.75, b: 424.95, shadow: 60, cam: { az0: 0.95, az1: 0.65, h: 2.5, fov: 46, minD: 12, ly: 1.5 }, who: (t) => [rider(t, HOLDER, [[0, { expr: "neutral", R: "coin", prop: "coin" }], [422.2, { expr: "o" }]])] },
  { id: "goxfall", a: 424.95, b: 428.65, shadow: 60, keys: [[424.95, [yr2x(2014.15) + 9, 5.5, CH.z + 26], [yr2x(2014.15), 3.5, CH.z + 10], 44], [428.65, [yr2x(2014.15) + 4, 4.5, CH.z + 23], [yr2x(2014.15), 2.5, CH.z + 10], 42]] },
  { id: "h_80", a: 428.65, b: 433.35, shadow: 60, cam: { az0: -0.6, az1: -0.25, h: 2.0, fov: 44, minD: 9 }, who: (t) => [rider(t, HOLDER, [[0, { expr: "grin", R: "coin", prop: "coin" }], [431.9, { expr: "shock" }], [432.9, { expr: "flat" }]])] },
  { id: "h_2021", a: 433.35, b: 437.05, shadow: 60, cam: { az0: 0.5, az1: 0.2, h: 1.2, fov: 44, minD: 8 }, who: (t) => [rider(t, HOLDER, [[0, { expr: "grin", R: "holdHigh" as any, prop: "coin" }], [435.6, { expr: "shock", R: "coin" }]])] },
  { id: "whisper", a: 437.05, b: 440.35, shadow: 25, cam: { az0: 0.5, az1: 0.25, h: 0.3, fov: 38 }, who: (t) => [
    ch(t, HOLDER, 26.4, -5.0, [[0, { expr: "neutral", R: "coin", prop: "coin" }], [438.6, { expr: "flat", headTilt: 5 }]]),
    ch(t, BUCK, 25.3, -4.6, [[0, { expr: "neutral", R: "whisper" as any }]], face(25.3, -4.6, 26.4, -5))] },
  { id: "sellnow", a: 440.35, b: 443.05, shadow: 25, cam: { az0: -0.25, az1: -0.05, h: 0.2, fov: 34 }, who: (t) => [
    ch(t, HOLDER, 26.4, -5.0, [[0, { expr: "flat", R: "coin", prop: "coin" }], [441.6, { expr: "o" }]], face(26.4, -5, 25.3, -4.6)),
    ch(t, BUCK, 25.3, -4.6, [[0, { expr: "flat", R: "whisper" as any }]], face(25.3, -4.6, 26.4, -5))] },
  { id: "lifechg", a: 443.05, b: 446.0, shadow: 30, traffic: 1, cam: { az0: 0.1, az1: 0.4, h: 0.6, fov: 42, minD: 6 }, who: (t) => [ch(t, HOLDER, -8.0, -5.4, [[0, { expr: "neutral", prop: "coin", R: "coin" }], [444.8, { expr: "wide" }]], face(-8, -5.4, -6, -12))] },
  { id: "lifechg2", a: 446.0, b: 449.05, shadow: 30, traffic: 1, cam: { az0: -0.4, az1: -0.1, h: 0.5, fov: 42, minD: 6 }, who: (t) => [ch(t, HOLDER, -20.0, -4.9, [[0, { expr: "content", prop: "coin", R: "coin" }], [447.6, { expr: "smile" }]], face(-20, -4.9, -20, 0))] },
  { id: "question", a: 449.05, b: 452.65, shadow: 25, traffic: 1, cam: hostCam(-1), who: host(449.05, 452.65, 146, -1, [[449.6, { R: "chin", expr: "flat" }], [451.6, { R: "down" }]]) },
  { id: "housecar", a: 452.65, b: 456.8, shadow: 30, traffic: 1, keys: [[452.65, [-10.5, 1.8, 2.0], [-6, 2.0, -12], 44], [454.6, [-14.5, 1.8, 2.2], [-20, 1.2, -2.4], 44], [456.8, [-17.5, 1.9, 2.4], [-26, 3.0, -16], 46]], who: (t) => [ch(t, HOLDER, -13.0, -5.2, [[0, { expr: "o", prop: "coin", R: "coin" }], [455.5, { expr: "content" }]], face(-13, -5.2, -13, 0))] },
  { id: "predict", a: 456.8, b: 460.85, shadow: 90, keys: [[456.8, [212, 14, 2], [CH.x1 + 7, 24, CH.z], 46], [460.85, [220, 20, -4], [CH.x1 + 7, 28, CH.z], 44]], who: (t) => [] },
  { id: "psych", a: 460.85, b: 467.25, shadow: 25, traffic: 1, cam: hostCam(-1), who: host(460.85, 467.25, -40, -1, [[461.4, { R: "chin", expr: "neutral" }], [463.6, { R: "down" }], [465.4, { L: "pointUp", expr: "flat" }], [466.6, { L: "down" }]]) },
  { id: "obvious", a: 467.25, b: 473.35, shadow: 40, cam: { az0: 0.6, az1: 0.15, h: 0.6, fov: 42, minD: 6, ly: 1.6 }, who: (t) => [
    wk(t, BUCK, [[467.25, CH.x0 + 4, CH.z + 4.0], [470.0, CH.x0 + 7, CH.z + 4.0], [470.3, CH.x0 + 7, CH.z + 4.0]], { expr: "neutral" }, Math.PI + 0.3)] },
  { id: "ceiling", a: 473.35, b: 479.05, shadow: 25, inside: "house", keys: [[473.35, [68.6, 2.95, -17.8], [68.4, 0.9, -19.75], 44], [479.05, [68.45, 2.7, -18.6], [68.4, 0.9, -19.75], 40]], who: (t) => [
    { c: LASZLO, pos: [69.3, F + 0.7, -19.75], st: act(t, [[0, { expr: "flat", L: "down", R: "down" }], [476.2, { expr: "neutral", look: 1 }], [479.0, { expr: "content" }]]), lie: true, blob: false }] },
  { id: "reporters", a: 479.05, b: 482.65, shadow: 30, cam: { az0: 0.3, az1: 0.05, h: 0.5, fov: 42, minD: 5.5 }, who: (t) => [
    ch(t, LASZLO, 73.8, -10.3, [[0, { expr: "smile" }], [481.0, { expr: "content", L: "shrug", R: "shrug" }], [482.2, { L: "down", R: "down" }]]),
    ch(t, extra(3), 72.3, -8.2, [[0, { prop: "mic", R: "coin", expr: "neutral" }]], face(72.3, -8.2, 73.8, -10.3)),
    ch(t, extra(14), 75.5, -8.4, [[0, { prop: "phone", R: "coin", expr: "neutral" }]], face(75.5, -8.4, 73.8, -10.3))] },
  { id: "reallygood", a: 482.65, b: 486.3, shadow: 25, cam: { az0: -0.2, az1: 0.05, h: 0.25, fov: 36 }, who: (t) => [ch(t, LASZLO, 73.8, -10.3, [[0, { expr: "content" }], [483.4, { R: "thumb", expr: "smile" }], [485.8, { R: "down" }]])] },
  { id: "freepizza", a: 486.3, b: 489.6, shadow: 25, inside: "house", cam: OFF(0.45, 0.15, 0.2, 40), scr: "hash", who: (t) => [lzDesk(t, [[0, { prop: "slice", R: "eat" as any, expr: "content" }], [487.6, { R: "hold", expr: "smile" }]])] },
  { id: "opensrc", a: 489.6, b: 493.25, shadow: 25, inside: "house", keys: crtK(489.6, 493.25, 1.4, 0.75), scr: "code" },
  { id: "hobby", a: 493.25, b: 497.1, shadow: 25, inside: "house", cam: OFF(-0.45, -0.15, 0.25, 40), who: (t) => [
    lzDesk(t, [[0, { prop: "slice", R: "eat" as any, expr: "content" }], [495.4, { R: "hold", expr: "grin" }]]),
    buckAt(t, 75.0, -17.9, [[493.4, { expr: "neutral", L: "shrug", R: "shrug" }], [494.8, { L: "down", R: "down" }], [495.6, { R: "point", expr: "flat" }], [496.6, { R: "down" }]], face(75, -17.9, 76.85, -20.1))] },
  { id: "treasure", a: 497.1, b: 502.2, shadow: 30, cam: { az0: 0.35, az1: 0.0, h: 0.5, fov: 42 }, who: (t) => [
    buckAt(t, STAND[0] + 1.35, -6.2, [[497.3, { L: "present", expr: "neutral" }], [499.6, { L: "down", expr: "flat" }], [500.8, { L: "shrug", R: "shrug" }], [501.8, { L: "down", R: "down" }]], -0.3),
    wk(t, extra(2), [[497.1, 13, -4.6], [502.2, 29, -4.6]], {}, undefined, { nf: true }), wk(t, extra(7), [[497.1, 27, -4.4], [502.2, 12, -4.4]], {}, undefined, { nf: true })] },
  { id: "monopoly", a: 502.2, b: 507.75, shadow: 30, cam: { az0: 0.45, az1: 0.15, h: 0.4, fov: 42 }, who: (t) => [
    ch(t, extra(2), 14.6, -5.2, [[0, { expr: "smile", R: "coin", prop: "coin" }], [504.4, { R: "present", prop: null }], [505.4, { R: "coin", prop: "coin" }], [506.6, { R: "present", prop: null }]], face(14.6, -5.2, 16.2, -5.0)),
    wk(t, extra(9), [[502.2, 20.6, -5.0], [503.8, 16.4, -5.0], [505.0, 16.4, -5.0], [507.75, 12.0, -5.0]], { expr: "o" }, face(16.4, -5, 14.6, -5.2)),
    ch(t, extra(5), 18.0, -5.6, [[0, { expr: "neutral" }], [506.6, { prop: "coin", R: "coin", expr: "smile" }]], face(18, -5.6, 14.6, -5.2), { nf: true })] },
  { id: "faucet", a: 507.75, b: 512.05, shadow: 25, inside: "house", keys: crtK(507.75, 512.05, 1.4, 0.75), scr: "faucet" },
  { id: "news", a: 512.05, b: 518.05, shadow: 25, cam: { az0: 0.4, az1: 0.05, h: 0.35, fov: 40 }, who: (t) => [
    ch(t, BUCK, 28.4, -5.3, [[0, { expr: "neutral", L: "present" }], [514.0, { expr: "flat" }], [516.0, { L: "down", L2: 0 } as any], [516.6, { expr: "flat", L: "shrug", R: "shrug" }], [517.6, { L: "down", R: "down" }]], face(28.4, -5.3, 27, -6.4))] },
  { id: "jer2", a: 518.05, b: 521.95, shadow: 25, inside: "room", cam: { az0: Math.PI + 0.45, az1: Math.PI + 0.15, h: 0.25, fov: 40 }, lap: "coins", who: (t) => [jDesk(t, [[0, { expr: "neutral" }], [520.6, { expr: "smile", R: "thumb" }]])] },
  { id: "notbillion", a: 521.95, b: 524.45, shadow: 30, cam: { az0: Math.PI - 0.5, az1: Math.PI - 0.2, h: 0.4, fov: 40 }, who: (t) => [ch(t, JEREMY, 104.2, 8.6, [[0, { expr: "flat", L: "shrug", R: "shrug" }], [523.4, { L: "down", R: "down", expr: "neutral" }]])] },
  { id: "spent", a: 524.45, b: 528.45, shadow: 30, cam: { az0: 0.5, az1: 0.2, h: 0.5, fov: 42, minD: 5 }, who: (t) => [wk(t, JEREMY, [[524.45, 41.0, -11.6], [526.0, 41.0, -9.6], [528.45, 44.6, -7.8]], { prop: "box", L: "hold", R: "hold", expr: "content" })] },
  { id: "twist", a: 528.45, b: 534.0, shadow: 30, cam: { az0: 0.9, az1: 0.5, h: 0.5, fov: 40 }, who: (t) => [
    buckAt(t, PEDESTAL[0] + 1.6, PEDESTAL[2] + 1.0, [[528.6, { L: "present", expr: "neutral" }], [531.0, { L: "down", expr: "flat" }], [533.2, { L: "pointUp" }]], face(PEDESTAL[0] + 1.6, PEDESTAL[2] + 1, PEDESTAL[0], PEDESTAL[2]))] },
  { id: "important", a: 534.0, b: 537.15, shadow: 60, cam: { az0: 0.2, az1: -0.2, h: 3.5, fov: 44, minD: 9, ly: 0.8 }, who: (t) => [
    buckAt(t, PEDESTAL[0] + 1.6, PEDESTAL[2] + 1.0, [[534.0, { L: "down", expr: "neutral" }]]), ...crowd2025(t, 6, -54, -12.5)] },
  { id: "spendit", a: 537.15, b: 540.0, shadow: 25, inside: "shop", cam: { az0: 0.45, az1: 0.15, h: 0.3, fov: 40 }, who: (t) => [
    COOKP(t, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "smile" }]]), ch(t, extra(8), 40.2, -15.3, [[0, { prop: "coin", R: "coin", expr: "smile" }], [538.6, { prop: null, R: "present" }]], face(40.2, -15.3, 41.2, -18.2))] },
  { id: "number", a: 540.0, b: 543.5, shadow: 25, inside: "house", keys: crtK(540.0, 543.5, 1.3, 0.72), scr: "number" },
  { id: "works", a: 543.5, b: 547.7, shadow: 25, inside: "house", cam: OFF(0.35, 0.05, 0.25, 40), who: (t) => [lzDesk(t, [[0, { prop: "slice", R: "eat" as any, expr: "content" }], [545.4, { R: "hold", expr: "smile" }]])] },
  { id: "firstprice", a: 547.7, b: 551.85, shadow: 25, inside: "house", cam: OFF(-0.3, 0.0, 0.3, 40), who: (t) => [lzDesk(t, [[0, { expr: "smile", facing: 1 }], [549.9, { expr: "grin" }]])] },
  { id: "pizzaday", a: 551.85, b: 556.7, shadow: 40, cam: { az0: 0.45, az1: 0.05, h: 2.0, fov: 44, minD: 9, ly: 0.8 }, who: (t) => [...crowd2025(t, 10), buckAt(t, -46.6, -7.9, [[552.0, { R: "present", expr: "smile" }], [554.4, { R: "down" }]])] },
  { id: "deals", a: 556.7, b: 561.2, shadow: 30, traffic: 1, cam: { az0: -0.4, az1: -0.1, h: 0.6, fov: 42, minD: 7, ly: 1.3 }, who: (t) => [
    wk(t, extra(3), [[556.7, 33.5, -8.2], [559.2, 40.6, -10.8], [561.2, 40.6, -11.2]], { prop: "coin", R: "coin", expr: "grin" }),
    wk(t, extra(12), [[556.7, 48.8, -8.0], [560.4, 42.4, -10.6]], { expr: "smile" }),
    buckAt(t, 45.4, -9.0, [[557.0, { L: "point", expr: "neutral" }], [559.6, { L: "down" }]], face(45.4, -9, 41, -12))] },
  { id: "hall", a: 561.2, b: 566.85, shadow: 40, cam: { az0: 0.3, az1: 0.05, h: 1.2, fov: 42, minD: 7, ly: 1.2 }, who: (t) => [
    ch(t, LASZLO, -50, -23.3, [[0, { expr: "smile" }], [564.3, { expr: "grin", R: "wave" }], [565.6, { R: "down" }]]), ...crowd2025(t, 5, -50, -17.5, Math.PI)] },
  { id: "inducted", a: 566.85, b: 570.9, shadow: 30, cam: { az0: -0.35, az1: -0.05, h: 0.9, fov: 44, ly: 0.9 }, who: (t) => [ch(t, LASZLO, -50, -23.3, [[0, { expr: "content", R: "down" }], [568.2, { prop: "trophy", L: "hold", R: "hold", expr: "grin" }]])] },
  { id: "lesson", a: 570.9, b: 574.7, shadow: 25, traffic: 1, cam: hostCam(-1), who: host(570.9, 574.7, 8, -1, [[571.4, { R: "chin", expr: "neutral" }], [572.8, { R: "down", L: "shrug", expr: "flat" }], [574.0, { L: "down" }]]) },
  { id: "future", a: 574.7, b: 578.5, shadow: 25, traffic: 1, cam: hostCam(-1), who: host(574.7, 578.5, 152, -1, [[575.2, { R: "pointUp", expr: "neutral" }], [576.8, { R: "down", expr: "flat" }]]) },
  { id: "earliest", a: 578.5, b: 582.15, shadow: 25, inside: "house", cam: OFF(0.4, 0.1, 0.25, 40), scr: "code", who: (t) => [lzDesk(t, [[0, { expr: "neutral" }], [580.6, { expr: "smile", facing: 0 }]], 580.4)] },
  { id: "evenhe", a: 582.15, b: 584.7, shadow: 25, inside: "house", cam: OFF(-0.25, 0.05, 0.2, 38), scr: "number", who: (t) => [lzDesk(t, [[0, { expr: "neutral", facing: 0, L: "shrug", R: "shrug" }], [583.6, { L: "down", R: "down", expr: "flat" }]])] },
  { id: "contra", a: 584.7, b: 588.1, shadow: 25, traffic: 1, cam: hostCam(1), who: host(584.7, 588.1, -132, 1, [[585.4, { R: "chin", expr: "neutral" }], [587.0, { R: "down" }]]) },
  { id: "spendcur", a: 588.1, b: 591.3, shadow: 25, inside: "shop", cam: { az0: -0.4, az1: -0.1, h: 0.3, fov: 40 }, who: (t) => [
    COOKP(t, [[0, { expr: "smile", R: "present" }]]), ch(t, HOLDER, 41.9, -15.3, [[0, { prop: "coin", R: "coin", expr: "neutral" }], [589.8, { R: "present", prop: null, expr: "smile" }]], face(41.9, -15.3, 41.2, -18.2))] },
  { id: "valuable", a: 591.3, b: 596.25, shadow: 25, inside: "shop", cam: { az0: 0.45, az1: 0.15, h: 0.3, fov: 40 }, who: (t) => [
    COOKP(t, [[0, { expr: "neutral", R: "present" }], [594.4, { expr: "flat", R: "down" }]]), ch(t, HOLDER, 40.1, -15.3, [[0, { prop: "coin", R: "coin", expr: "neutral" }], [593.6, { R: "holdHigh" as any, L: "hold", expr: "flat" }], [595.0, { prop: "coin", R: "hold", expr: "content" }]], face(40.1, -15.3, 41.2, -18.2))] },
  { id: "tomorrow", a: 596.25, b: 599.95, shadow: 25, cam: { az0: 0.25, az1: -0.05, h: 0.3, fov: 38 }, who: (t) => [ch(t, HOLDER, 43.0, -9.8, [[0, { prop: "coin", R: "hold", L: "hold", expr: "content" }], [598.0, { expr: "smile", headTilt: -5 }]])] },
  { id: "gold", a: 599.95, b: 605.65, shadow: 40, cam: { az0: 0.35, az1: 0.05, h: 0.6, fov: 42, minD: 7, ly: 1.4 }, who: (t) => [
    ch(t, HOLDER, yr2x(2025.3) + 3.6, CH.z + 7.6, [[0, { prop: "coin", R: "hold", L: "hold", expr: "content" }], [603.2, { expr: "smile" }]], face(yr2x(2025.3) + 3.6, CH.z + 7.6, yr2x(2025.3) + 6, CH.z + 7))] },
  { id: "special", a: 605.65, b: 610.0, shadow: 25, inside: "house", cam: OFF(0.5, 0.15, 0.25, 40), who: (t) => [lzDesk(t, [[0, { prop: "slice", R: "eat" as any, expr: "content" }], [607.6, { R: "hold", expr: "smile" }]])] },
  { id: "spendmoney", a: 610.0, b: 615.3, shadow: 25, inside: "shop", cam: { az0: 0.3, az1: -0.1, h: 0.3, fov: 40 }, who: (t) => [
    COOKP(t, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "smile" }]]), ch(t, LASZLO, 40.6, -15.3, [[0, { prop: "coin", R: "coin", expr: "smile" }], [612.6, { R: "present", prop: null }]], face(40.6, -15.3, 41.2, -18.2))] },
  { id: "y2018", a: 615.3, b: 620.35, shadow: 30, traffic: 1, cam: { az0: 0.5, az1: 0.15, h: 0.6, fov: 42, minD: 5.5, ly: 1.4 }, who: (t) => [wk(t, LASZLO, [[615.3, 36.0, -5.6], [617.6, 39.8, -8.6], [618.6, 40.6, -11.3]], { expr: "smile" })] },
  { id: "lightning", a: 620.35, b: 624.35, shadow: 25, inside: "shop", cam: { az0: -0.3, az1: 0.0, h: 0.3, fov: 38 }, who: (t) => [
    COOKP(t, [[0, { expr: "neutral" }], [622.4, { expr: "smile", prop: "boxes", L: "hold", R: "hold" }]]), ch(t, LASZLO, 41.8, -15.3, [[0, { prop: "phone", R: "coin", expr: "neutral" }], [623.2, { expr: "grin" }]], face(41.8, -15.3, 41.2, -18.2))] },
  { id: "cheap", a: 624.35, b: 628.35, shadow: 25, inside: "shop", cam: { az0: 0.35, az1: 0.65, h: 0.3, fov: 40 }, who: (t) => [
    COOKP(t, [[0, { expr: "smile" }]]), ch(t, LASZLO, 40.4, -15.3, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "content" }], [626.4, { expr: "grin" }]], face(40.4, -15.3, 41.2, -18.2))] },
  { id: "learned", a: 628.35, b: 632.1, shadow: 30, traffic: 1, cam: { az0: -0.6, az1: -0.25, h: 0.5, fov: 42 }, who: (t) => [wk(t, LASZLO, [[628.35, 41.0, -11.4], [629.6, 41.0, -9.4], [632.1, 37.4, -7.6]], { prop: "boxes", L: "hold", R: "hold", expr: "content" })] },
  { id: "cheaporder", a: 632.1, b: 635.35, shadow: 30, traffic: 1, cam: { az0: -1.0, az1: -0.7, h: 0.4, fov: 40 }, who: (t) => [wk(t, LASZLO, [[632.1, 37.4, -7.6], [635.35, 33.8, -6.2]], { prop: "boxes", L: "hold", R: "hold", expr: "smile" })] },
  { id: "billioncrazy", a: 635.35, b: 639.2, shadow: 30, traffic: 1, cam: { az0: Math.PI - 0.5, az1: Math.PI - 0.2, h: 0.8, fov: 44, minD: 6, ly: 2.2 }, who: (t) => [buckAt(t, -93.0, 8.6, [[635.5, { expr: "flat", L: "shrug", R: "shrug" }], [637.6, { L: "down", R: "down" }]], Math.PI)] },
  { id: "eiffel", a: 639.2, b: 643.6, shadow: 30, keys: [[639.2, [-88.2, 2.6, 4.2], [-90.8, 3.4, 12], 42], [643.6, [-89.4, 3.0, 7.0], [-90.8, 3.3, 12], 36]] },
  { id: "next", a: 643.6, b: 649.05, shadow: 30, traffic: 1, cam: { az0: Math.PI + 0.35, az1: Math.PI + 0.05, h: 0.6, fov: 42, minD: 5.5, ly: 1.8 }, who: (t) => [buckAt(t, -94.0, 8.8, [[643.8, { L: "present", expr: "smile" }], [645.6, { L: "down" }], [646.4, { R: "pointUp", expr: "neutral" }], [647.8, { R: "wave", expr: "smile" }]])] },
  { id: "disclaim", a: 649.05, b: 653.6, shadow: 30, traffic: 1, cam: { az0: Math.PI - 0.15, az1: Math.PI + 0.15, h: 0.3, fov: 38 }, who: (t) => [buckAt(t, -94.0, 8.8, [[0, { expr: "neutral" }], [649.2, { R: "pointUp" }], [650.6, { R: "down", expr: "flat" }]])] },
];
export const shotAt = (t: number) => SHOTS.find((s) => t >= s.a && t < s.b) ?? SHOTS[SHOTS.length - 1];
// chart rider: year per time (null = hidden)
const RIDE: [number, number][] = [[338.6, 2010.4], [340.8, 2010.9], [344.2, 2011.15], [350.1, 2011.2], [352.6, 2013.0], [356.6, 2013.9], [361.2, 2013.95], [364.4, 2016.9], [368.6, 2017.96], [373.7, 2020.6], [377.3, 2021.85], [380, 2024.6], [382.5, 2025.39], [392.4, 2025.39]];
const RIDE2: [number, number][] = [[402.7, 2010.4], [407.7, 2010.9], [410.0, 2011.45], [413.6, 2011.9], [419.7, 2013.0], [424.9, 2013.9], [428.6, 2014.4], [430.0, 2017.96], [432.6, 2018.95], [433.3, 2020.9], [435.5, 2021.85], [437.0, 2022.9]];
export const riderYear = (t: number): number | null => {
  const tr = t >= 338.6 && t < 392.45 ? RIDE : t >= 402.75 && t < 437.05 ? RIDE2 : null; if (!tr) return null;
  let i = 0; while (i < tr.length - 2 && t > tr[i + 1][0]) i++;
  const [t0, y0] = tr[i], [t1, y1] = tr[i + 1]; return y0 + (y1 - y0) * smooth((t - t0) / (t1 - t0));
};

// ---------------- camera ----------------
const herm = (k: Key[], t: number, sel: 1 | 2) => {
  let i = 0; while (i < k.length - 2 && t > k[i + 1][0]) i++;
  const p = (j: number) => k[Math.max(0, Math.min(k.length - 1, j))];
  const t0 = p(i)[0], t1 = p(i + 1)[0], h = t1 - t0, u = clamp01((t - t0) / h);
  const tan = (j: number, c: number) => { const a = p(j - 1), b = p(j + 1); return (b[sel][c] - a[sel][c]) / Math.max(1e-3, b[0] - a[0]); };
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return [0, 1, 2].map((c) => h00 * p(i)[sel][c] + h10 * h * tan(i, c) + h01 * p(i + 1)[sel][c] + h11 * h * tan(i + 1, c)) as V3;
};
const ROOMS: Record<string, [number, number, number, number, number]> = { house: [67.35, 80.65, -20.7, -11.35, 3.15], shop: [35.35, 46.65, -21.7, -12.35, 3.35], room: [100.35, 109.65, 12.35, 20.7, 3.15] };
const headH = (w: Who) => (w.st.mode === "sit" ? 1.62 : 2.05) * (w.k ?? 1);
const bboxC = (ws: Who[]) => {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const w of ws) { x0 = Math.min(x0, w.pos[0]); x1 = Math.max(x1, w.pos[0]); z0 = Math.min(z0, w.pos[2]); z1 = Math.max(z1, w.pos[2]); y0 = Math.min(y0, w.pos[1]); y1 = Math.max(y1, w.pos[1] + headH(w)); }
  return { c: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] as V3 };
};
const needD = (ws: Who[], c: V3, az: number, fov: number) => {
  const tv = Math.tan((fov * Math.PI) / 360), th = tv * 16 / 9, D = [Math.sin(az), Math.cos(az)], R = [Math.cos(az), -Math.sin(az)];
  let d = 0;
  for (const w of ws) for (const y of [w.pos[1] - 0.05, w.pos[1] + headH(w) + 0.12]) {
    const rx = w.pos[0] - c[0], rz = w.pos[2] - c[2], lat = Math.abs(rx * R[0] + rz * R[1]) + 0.5 * (w.k ?? 1), dep = rx * D[0] + rz * D[1];
    d = Math.max(d, dep + lat / (th * 0.8), dep + Math.abs(y - c[1]) / (tv * 0.8));
  }
  return d;
};
const dCache = new Map<string, number>();
const camFrame = (s: Shot, t: number) => {
  const c = s.cam!, fov = c.fov ?? 42, u = clamp01((t - s.a) / (s.b - s.a)), az = lerp(c.az0, c.az1, u);
  const ws = (s.who?.(t) ?? []).filter((w) => !w.nf);
  let base = dCache.get(s.id);
  if (base === undefined) {
    base = c.minD ?? 2.4;
    for (let k = 0; k <= 6; k++) { const ts = s.a + (s.b - s.a) * (k / 6) * 0.999, w2 = (s.who?.(ts) ?? []).filter((w) => !w.nf); if (w2.length) base = Math.max(base, needD(w2, bboxC(w2).c, lerp(c.az0, c.az1, k / 6), fov)); }
    dCache.set(s.id, base);
  }
  const C = ws.length ? bboxC(ws).c : ([0, 1, 0] as V3), d = base * (1 + (c.push ?? 0.08) * (0.5 - u));
  const pos: V3 = [C[0] + Math.sin(az) * d, C[1] + (c.h ?? 0.3), C[2] + Math.cos(az) * d];
  const look: V3 = [C[0], C[1] + (c.ly ?? 0), C[2]];
  const r = s.inside ? ROOMS[s.inside] : null;
  if (r) { pos[0] = Math.max(r[0], Math.min(r[1], pos[0])); pos[2] = Math.max(r[2], Math.min(r[3], pos[2])); pos[1] = Math.min(r[4], pos[1]); }
  return { pos, look, fov };
};
export const KICKS = [0.33, 19.36, 41.7, 7.2];
export const camAt = (t: number) => {
  const s = shotAt(t);
  let pos: V3, look: V3, fov: number;
  if (s.keys) {
    const k = s.keys; pos = herm(k, t, 1); look = herm(k, t, 2);
    let i = 0; while (i < k.length - 2 && t > k[i + 1][0]) i++;
    const u = clamp01((t - k[i][0]) / (k[i + 1][0] - k[i][0])); fov = lerp(k[i][3] ?? 44, k[i + 1][3] ?? 44, smooth(u));
  } else ({ pos, look, fov } = camFrame(s, t));
  let roll = 0;
  for (const kt of KICKS) { const df = Math.round((t - kt) * FPS); if (df >= 0 && df < 8) { const a = (1 - df / 8) * (df % 2 ? -1 : 1); roll += a * 0.02; pos[1] += a * 0.05; } }
  return { pos, look, fov, roll, shot: s };
};

// ---------------- voices: lip-sync for whoever speaks (narrator Buck; Laszlo during his quotes) ----------------
import { ampAt } from "./amp";
const QUOTES: [number, number][] = [[161.3, 167.8], [175.4, 177.9], [276.3, 281.0], [483.3, 485.6]];
export const speakerAt = (t: number) => (QUOTES.some(([a, b]) => t >= a && t < b) ? "laszlo" : "buck");
let wi = 0;
export const talkAt = (t: number) => {
  if (wi >= WORDS.length || WORDS[wi][0] > t + 1) wi = 0;
  while (wi < WORDS.length - 1 && WORDS[wi][1] < t - 0.5) wi++;
  for (let i = wi; i < WORDS.length && WORDS[i][0] < t + 0.1; i++) { const [a, b] = WORDS[i]; if (t >= a - 0.03 && t < b - 0.02) return Math.min(1, 0.22 + 1.1 * ampAt(t * FPS)); }
  return 0;
};
const oldCast = (t: number, s: string): Who[] => {
  const out: Who[] = [];
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
      { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }, Math.PI);
    d.st.prop = "boxes";
    if (d.st.mode === "stand") { d.st = { ...act(t, [[0, { prop: "boxes", L: "hold", R: "hold", expr: "neutral" }], [13.6, { expr: "smile" }]]) }; }
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


export const cast = (t: number): Who[] => {
  const s = shotAt(t);
  if (s.who) return s.who(t);
  const out = oldCast(t, s.id);
  if (s.id === "hook") { // busy street: passers-by on both sidewalks
    out.push(wk(t, extra(11), [[-1, -70, 5.6], [3, -64.5, 5.6]], {}, undefined, { nf: true }), wk(t, extra(12), [[-1, -40, 5.3], [3, -45.5, 5.3]], {}, undefined, { nf: true }),
      wk(t, extra(13), [[-1, -61, 6.4], [3, -57.4, 6.4]], {}, undefined, { nf: true }), wk(t, extra(14), [[-1, -57.5, -6.6], [3, -53.0, -6.6]], {}, undefined, { nf: true }));
  }
  return out;
};

// ---------------- key numbers / dates / lower thirds (exactly as said in the VO); screen spot chosen at render time, away from every head ----------------
export type TextItem = { a: number; b: number; s: string; size: number; col: string; slam?: boolean; lt?: boolean };
const Y = "#FFD21F", Wt = "#ffffff", RD = "#ff6b5a";
const T = (a: number, b: number, s: string, size: number, col = Y, slam = true): TextItem => ({ a, b, s, size, col, slam });
const LT = (a: number, b: number, s: string): TextItem => ({ a, b, s, size: 46, col: Wt, lt: true });
export const TEXTS: TextItem[] = [
  T(0.0, 1.95, "MAY 22, 2025", 70, Wt, false), T(0.33, 2.6, "$1,100,000,000", 150), T(4.86, 6.55, "2 PIZZAS", 150), T(11.28, 12.9, "15 YEARS EARLIER", 110, Wt),
  T(19.36, 22.85, "$1.1 BILLION", 180), T(41.7, 43.0, "2010", 260), T(44.2, 46.3, "1 YEAR OLD", 120, Wt),
  LT(64.6, 67.5, "LASZLO HANYECZ  |  28  |  PROGRAMMER"), T(78.88, 80.0, "CPU", 120, Wt), T(82.28, 84.15, "GRAPHICS CARD", 100, Y),
  T(94.5, 95.35, "EVERY 10 MINUTES", 100, Wt), T(112.28, 115.25, "1,000 WORKERS", 110), T(126.3, 129.7, "1.5% OF ALL BITCOIN", 110),
  T(156.98, 161.2, "MAY 18, 2010", 100, Wt), T(183.98, 186.4, "10,000 BITCOINS", 130),
  T(188.66, 189.85, "DAY 1", 110, Wt), T(189.88, 190.75, "DAY 2", 110, Wt), T(190.78, 191.45, "DAY 3", 110, Wt), T(201.24, 203.4, "DAY 4", 110),
  LT(203.6, 205.5, "USERNAME: JERCOS"), LT(205.62, 210.3, "JEREMY STURDIVANT  |  19  |  CALIFORNIA"),
  T(212.64, 214.35, "LESS THAN HALF A CENT", 90, Wt), T(214.88, 218.6, "ABOUT $40", 160), T(235.0, 236.55, "LESS THAN $50", 120),
  T(237.26, 241.55, "MAY 22, 2010", 100, Wt), T(243.66, 245.2, "ABOUT $41", 150), T(290.76, 292.0, "2 PIZZAS", 150),
  LT(306.2, 307.65, "TELL ME IN THE COMMENTS"), T(324.6, 328.2, "ABOUT 80,000 BITCOINS", 110), T(329.0, 331.4, "CLOSER TO 100,000", 110),
  T(340.92, 344.55, "FEBRUARY 2011", 90, Wt), T(342.34, 344.55, "1 BITCOIN = $1.00", 110), T(345.7, 350.1, "$10,000", 180),
  T(353.62, 357.25, "LATE 2013", 90, Wt), T(354.82, 357.25, "1 BITCOIN = $1,000", 110), T(357.74, 361.2, "$10 MILLION", 180),
  T(364.6, 369.4, "END OF 2017", 90, Wt), T(366.6, 369.4, "NEARLY $20,000", 120), T(369.96, 373.7, "$200 MILLION", 180),
  T(373.78, 377.5, "2021", 120, Wt), T(375.6, 377.5, "HALF A BILLION", 140), T(377.6, 381.15, "PIZZA DAY 2025", 90, Wt), T(381.4, 385.0, "$1.1 BILLION", 190),
  T(385.1, 388.65, "ONLY THE FIRST 2 PIZZAS", 80, Wt), T(389.0, 392.4, "CLOSE TO 100,000 BITCOINS", 90, Wt), T(391.0, 392.4, "ADD ANOTHER ZERO", 110),
  T(399.6, 402.7, "10,000 BITCOINS", 110), T(410.0, 411.4, "2011: ABOUT $30", 120), T(412.0, 414.3, "A COUPLE OF DOLLARS", 100, Wt),
  T(416.1, 418.0, "$300,000", 140), T(418.0, 419.7, "$20,000", 140, RD), T(420.52, 424.9, "2014", 120, Wt), T(421.6, 424.9, "MT. GOX", 110),
  T(428.7, 433.3, "2017 PEAK", 90, Wt), T(431.88, 433.3, "-80%", 200, RD), T(433.78, 437.0, "2021 PEAK", 90, Wt), T(440.42, 443.0, "SELL. SELL NOW.", 100, Wt),
  T(465.54, 467.2, "HINDSIGHT BIAS", 130), T(502.84, 507.7, "MONOPOLY MONEY", 110), T(552.5, 556.65, "MAY 22 = BITCOIN PIZZA DAY", 80, Wt),
  T(561.64, 564.3, "MAY 22, 2025", 100, Wt), T(564.32, 566.8, "15 YEARS LATER", 100), T(602.84, 605.6, "DIGITAL GOLD", 140),
  T(615.82, 620.3, "2018", 150, Wt), T(623.22, 624.3, "LIGHTNING NETWORK", 100), T(626.34, 628.3, "LESS THAN 1/100 BITCOIN", 90),
  T(643.6, 646.25, "NEXT ON OOPSONOMICS", 100), T(646.32, 649.0, "SUBSCRIBE", 130, Wt), LT(650.2, 653.55, "HISTORY AND ENTERTAINMENT, NOT FINANCIAL ADVICE"),
];
export const FLASH_AT = [40.75];
