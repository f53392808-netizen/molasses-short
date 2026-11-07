// Timeline of the molasses short: shots timed to the voice words (voice/words.json, frames = s x 30), the flood
// physics (radial wave from the tank: front radius, crest height, settled depth), the tank state (grey -> painted
// brown -> split -> wreck) and the camera grammar of the bridge short: slow push-ins, smootherstep glides, cuts on
// big reframes, 7-frame flip kicks on impacts, no hand-held float.
export const FPS = 30;
export const TOTAL = 1890; // 63.0 s: voice ends at 61.1 s
export const D0 = 0; // street level (m)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- layout (metres) ----------------
// harbour quay at z = QUAY (water beyond, z < QUAY); tank on the wharf; Commercial Street along x (z 0..14) under the
// elevated railway (deck z 3..11, columns at x = 10k); inland brick blocks with fronts at z = 16.
export const QUAY = -33;
export const WATER_Y = -1.6;
export const TANK: V3 = [0, 0, -17];
export const TANK_R = 13.7; // 90 ft diameter
export const TANK_H = 15.2; // 50 ft
export const STREET_Z = 7;
export const EL_Y = 6.4; // underside of the elevated deck
export const EL_Z0 = 3, EL_Z1 = 11;
export const elColX = (k: number) => 10 * k;
export const FIREHOUSE: V3 = [58, 0, -12];
export const EL_HIT_X = -80; // column the wave slams into
export const KITCHEN: V3 = [1000, 0, 0]; // honey insert set (enclosed room far outside the town)
export const OFFICE: V3 = [1000, 0, 80]; // engineer's desk set

// ---------------- story time ----------------
// tau = story seconds on the voice clock (most shots run tau = t). The tank splits at BURST ("walls split", f 814).
export const BURST = 27.2;
export const PAINT0 = 569 / FPS, PAINT1 = 612 / FPS; // brown paint sweeps down the tank ("painted ... brown")
export const RIVETS = [779, 783, 789, 794, 800].map((f) => f / FPS); // "pop like gunfire"
export const CRACK0 = 806 / FPS;
/** flood front radius from the tank centre, s = seconds since the burst (35 mph start, slowing to a stop at ~12 s) */
const V0 = 15.6, TSTOP = 12;
export const frontR = (s: number) => (s <= 0 ? TANK_R : TANK_R + V0 * Math.min(s, TSTOP) * (1 - Math.min(s, TSTOP) / (2 * TSTOP)));
/** crest height above the street: 25 ft (7.6 m) at the outset, falling as it spreads */
export const crestH = (s: number) => 0.75 + 6.9 * Math.exp(-Math.max(0, s) / 5.5);
/** depth behind the crest: chest-deep near the tank, 2-3 ft over the blocks once settled (Wikipedia / SciAm) */
export const baseH = (s: number, r: number) => {
  const settle = smooth((s - 4) / 10);
  const near = 1.4 - 0.25 * settle, far = 0.95 - 0.35 * settle;
  return near + (far - near) * clamp01((r - TANK_R) / 90);
};
export type Flood = { on: boolean; s: number; level: number; thick: number };
/** molasses state for shot id at t: s = seconds since the burst; level scales depth (cleanup); thick = cooled/matte */
export const floodAt = (id: number, t: number): Flood => {
  const s = SHOTS[id - 1].tau(t) - BURST;
  if (id === 1 || id === 8 || id === 9) return { on: s > 0, s, level: 1, thick: 0 };
  if (id === 10 || id === 12 || id === 13) return { on: true, s: 600, level: 1, thick: id === 10 ? 0.6 : 1 };
  if (id === 15) return { on: true, s: 600, level: 0.55 - 0.2 * clamp01((t - 55) / 3), thick: 1 };
  return { on: false, s: 0, level: 0, thick: 0 };
};
/** tank: 0 grey steel, 1 brown; split 0..1 opens the crack; wreck = burst and gone */
export type TankState = { brown: number; groan: number; split: number; wreck: boolean; gone: boolean };
export const tankAt = (id: number, t: number): TankState => {
  const tau = SHOTS[id - 1].tau(t);
  if (id === 16) return { brown: 1, groan: 0, split: 0, wreck: false, gone: true };
  if (tau >= BURST || id === 1 || id >= 8) return { brown: 1, groan: 0, split: 1, wreck: true, gone: false };
  const brown = id < 5 ? 0 : id === 5 ? clamp01((tau - PAINT0) / (PAINT1 - PAINT0)) : 1;
  const groan = id === 6 && tau > 23.5 ? 0.5 + 0.5 * Math.sin(tau * 9) : id === 7 ? 1 : 0;
  return { brown, groan, split: id === 7 ? clamp01((tau - CRACK0) / (BURST - CRACK0)) : 0, wreck: false, gone: false };
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "none" | "street" | "kids" | "painter" | "horse" | "stuck" | "kitchen" | "office" | "hose" | "summer" | "fleeing";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 145, light: "day", crowd: "none", tau: (t) => BURST + 0.8 + t * 0.4 }, // flash-forward: the wave on the street
  { id: 2, a: 145, b: 302, light: "day", crowd: "street", tau: (t) => t },
  { id: 3, a: 302, b: 447, light: "day", crowd: "none", tau: (t) => t },
  { id: 4, a: 447, b: 531, light: "day", crowd: "kids", tau: (t) => t },
  { id: 5, a: 531, b: 644, light: "day", crowd: "painter", tau: (t) => t },
  { id: 6, a: 644, b: 748, light: "day", crowd: "none", tau: (t) => t },
  { id: 7, a: 748, b: 828, light: "day", crowd: "none", tau: (t) => t },
  { id: 8, a: 828, b: 1028, light: "day", crowd: "none", tau: (t) => t },
  { id: 9, a: 1028, b: 1093, light: "day", crowd: "none", tau: (t) => BURST + 7 + (t - 1028 / FPS) * 1.6 },
  { id: 10, a: 1093, b: 1145, light: "day", crowd: "horse", tau: (t) => t },
  { id: 11, a: 1145, b: 1283, light: "day", crowd: "kitchen", tau: (t) => t },
  { id: 12, a: 1283, b: 1408, light: "day", crowd: "stuck", tau: (t) => t },
  { id: 13, a: 1408, b: 1489, light: "day", crowd: "none", tau: (t) => t },
  { id: 14, a: 1489, b: 1648, light: "day", crowd: "office", tau: (t) => t },
  { id: 15, a: 1648, b: 1731, light: "day", crowd: "hose", tau: (t) => t },
  { id: 16, a: 1731, b: TOTAL, light: "golden", crowd: "summer", tau: (t) => t },
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 11: 8, 12: 8, 14: 8, 15: 8, 16: 10 };
export const FLASH_AT = 145;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
// Wide framing (user, Nov 7 2026: too zoomed in): pull back 1.45x from the look point and widen the lens.
const PULL = 1.45;
const full = (c: Shot): Cam => {
  const fov0 = c.fov ?? 40;
  const pos = c.look.map((v, i) => v + (c.pos[i] - v) * PULL) as V3;
  return { roll: 0, ...c, pos, fov: Math.min(62, Math.max(52, fov0 * 1.25)) };
};
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * 0.5 * x;
  if (false && punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

/** x where the flood front crosses the street centre line, on the -x side of the tank (s = seconds since the burst) */
export const streetFrontX = (s: number) => {
  const R = frontR(s), dz = STREET_Z - TANK[2];
  return -Math.sqrt(Math.max(0, R * R - dz * dz));
};
const sOf = (id: number, f: number) => SHOTS[id - 1].tau(T(f)) - BURST;
const tk = (dx: number, y: number, dz: number): V3 => [TANK[0] + dx, y, TANK[2] + dz];
const K = KITCHEN, O = OFFICE;

// shot 1 (hook): low on Commercial Street, the lens retreats ahead of the wave rolling toward it
const S1a = (f: number) => { const x = streetFrontX(sOf(1, f)); return dolly([x - 30, 1.6, 13.4], [x + 2, 3.4, 5.6], pushK(f, 0, 0.0018), { fov: 50, roll: -0.03 }); };
const S1b = (f: number) => { const x = streetFrontX(sOf(1, f)); return dolly([x - 22, 1.3, 13.0], [x + 2, 3.8, 5.8], pushK(f, 70, 0.0025), { fov: 48, roll: 0.035 }); };
// shot 2: aerial over the North End (wharf, tank, el, brick blocks), then street level on "the day is suddenly warm"
const S2a = (f: number) => zoom([-78, 46, 92], [4, 4, -8], 42, pushK(f, 145, 0.0018));
const S2b = (f: number) => zoom([-62, 40, 78], [4, 6, -10], 40, pushK(f, 196, 0.002));
const S2c = (f: number) => dolly([-46, 1.9, 12.6], [-22, 2.3, 5.4], pushK(f, 235, 0.0022), { fov: 42 });
// shot 3: the tank from the street, low; tilt up on "fifty feet"; wider 3/4 on "million gallons"
const S3a = (f: number) => dolly(tk(9, 1.3, 19.2), tk(0, 6.5, 0), pushK(f, 302, 0.0022), { fov: 46 });
const S3b = (f: number) => dolly(tk(7, 1.0, 18.4), tk(0, 12.5, 0), pushK(f, 335, 0.002), { fov: 48, roll: -0.04 });
const S3c = (f: number) => dolly(tk(34, 9, 30), tk(0, 7.5, 0), pushK(f, 376, 0.0025), { fov: 42 });
// shot 4: kids with pails at the leaking base
const S4a = (f: number) => dolly(tk(0.7, 1.15, 21.6), tk(0.5, 1.0, 14.4), pushK(f, 447, 0.0025), { fov: 44 });
const S4b = (f: number) => dolly(tk(0.2, 1.0, 19.6), tk(0.3, 0.9, 14.3), pushK(f, 486, 0.002, 0.005, 26), { fov: 42, roll: 0.035 });
// shot 5: painted brown: the whole front of the tank, the paint line sweeps down
const S5a = (f: number) => dolly(tk(16, 3.2, 26), tk(0, 8.5, 0), pushK(f, 531, 0.0015), { fov: 44 });
const S5b = (f: number) => dolly(tk(10, 2.4, 22.5), tk(0, 6.5, 0), pushK(f, 593, 0.002, 0.005, 28), { fov: 44, roll: -0.035 });
// shot 6: the ship at the wharf pumping warm molasses up into the tank, then the tank groans
const S6a = (f: number) => dolly([46, 6.5, -60], [2, 6, -28], pushK(f, 644, 0.002), { fov: 42 });
const S6b = (f: number) => zoom(tk(7, 1.1, 17.6), tk(0, 9, 0), 46, pushK(f, 704, 0.003), { roll: 0.04 });
// shot 7: rivet seam close-up ("pop like gunfire"), the crack runs ("the walls split")
const S7a = (f: number) => dolly(tk(2.6, 2.4, 17.8), tk(0.9, 2.7, 13.55), pushK(f, 748, 0.002), { fov: 36 });
const S7b = (f: number) => dolly(tk(4.8, 1.6, 21.5), tk(0.6, 4.2, 13.7), pushK(f, 806, 0.004), { fov: 42, roll: -0.045 });
// shot 8: the lens backs down Commercial Street ahead of the wave; the firehouse; the el column
const S8a = (f: number) => { const x = Math.min(-16, streetFrontX(sOf(8, f))); return dolly([x - 26, 1.6, 13.2], [x + 4, 3.6, 5.8], pushK(f, 828, 0.0015), { fov: 50 }); };
const S8b = (f: number) => dolly([FIREHOUSE[0] - 7, 2.0, 12.5], [FIREHOUSE[0] + 1, 3.6, FIREHOUSE[2] + 2], pushK(f, 926, 0.002), { fov: 44, roll: 0.03 });
const S8c = (f: number) => dolly([EL_HIT_X - 15, 2.2, -4.5], [EL_HIT_X, 3.8, 5], pushK(f, 979, 0.0025), { fov: 44, roll: -0.03 });
// shot 9: aerial over the spreading flood ("slowed down within minutes")
const S9a = (f: number) => zoom([-30, 64, 70], [2, 0, -6], 44, pushK(f, 1028, 0.0012));
// shot 10: ground level in the settled molasses, a horse and wagon stuck ("that's when it got worse")
const S10a = (f: number) => dolly([-20.5, 1.55, 3.2], [-29, 1.2, 9.4], pushK(f, 1093, 0.0028, 0.006, 26), { fov: 40, roll: 0.03 });
// shot 11: kitchen insert: warm honey pours, honey from the fridge barely moves
const S11a = (f: number) => dolly([K[0], 1.55, K[2] + 2.6], [K[0], 1.0, K[2]], pushK(f, 1145, 0.002), { fov: 40 });
const S11b = (f: number) => dolly([K[0] - 0.55, 1.3, K[2] + 1.45], [K[0] - 0.5, 1.02, K[2]], pushK(f, 1184, 0.0025), { fov: 38 });
const S11c = (f: number) => dolly([K[0] + 0.6, 1.3, K[2] + 1.45], [K[0] + 0.55, 1.02, K[2]], pushK(f, 1229, 0.0025, 0.005, 26), { fov: 38, roll: -0.035 });
// shot 12: people trapped waist-deep in the cooled molasses
const S12a = (f: number) => dolly([-5.5, 1.5, 2.8], [-14, 1.0, 8.2], pushK(f, 1283, 0.0022), { fov: 42 });
const S12b = (f: number) => dolly([-9.2, 1.35, 4.4], [-14.2, 1.15, 8.0], pushK(f, 1349, 0.0025), { fov: 38, roll: 0.03 });
// shot 13: quiet wide of the wrecked tank and the brown blocks (the toll); slow push, no characters
const S13a = (f: number) => dolly(tk(34, 10, 44), tk(0, 1.5, 4), pushK(f, 1408, 0.0016), { fov: 42 });
// shot 14: the engineer's desk: sign, then stamp the plan
const S14a = (f: number) => dolly([O[0] + 0.2, 1.75, O[2] + 2.9], [O[0], 1.15, O[2]], pushK(f, 1489, 0.0018), { fov: 40 });
const S14b = (f: number) => dolly([O[0] + 0.15, 1.6, O[2] + 0.95], [O[0] + 0.05, 0.86, O[2] + 0.12], pushK(f, 1550, 0.0025), { fov: 38, roll: 0.03 });
const S14c = (f: number) => zoom([O[0] - 1.8, 2.6, O[2] + 3.6], [O[0], 1.0, O[2]], 44, pushK(f, 1609, 0.002));
// shot 15: crews hosing the street with harbour water, the fireboat behind
const S15a = (f: number) => dolly([22, 2.0, 6.5], [6, 1.2, -16], pushK(f, 1648, 0.002), { fov: 46 });
// shot 16: golden summer evening decades later: the street, someone sniffs, crane out over the North End
const S16a = (f: number) => dolly([-34, 1.7, 5.4], [-16, 1.9, 8.6], pushK(f, 1731, 0.002), { fov: 42 });
const S16b = (f: number) => dolly([-24.5, 1.65, 6.1], [-20.4, 1.75, 9.2], pushK(f, 1784, 0.0015, 0.005, 28), { fov: 38, roll: 0.035 });
const CRANE: V3[] = [[-38, 14, 6], [-80, 46, 60], [0, 4, -10]];
const S16c = (f: number): Shot => {
  const a = S16b(1828), s = glide((f - 1828) / 62), r = 1 - s, [C, B, L] = CRANE;
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * B[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: (a.fov ?? 40) + (42 - (a.fov ?? 40)) * s, roll: (a.roll ?? 0) * r };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 70, dur: 30, s: S1b }],
  2: [{ f: 140, s: S2a }, { f: 196, dur: 30, s: S2b }, { f: 235, cut: true, s: S2c }],
  3: [{ f: 302, s: S3a }, { f: 335, dur: 30, s: S3b }, { f: 376, cut: true, s: S3c }],
  4: [{ f: 447, s: S4a }, { f: 486, dur: 22, s: S4b }],
  5: [{ f: 531, s: S5a }, { f: 593, dur: 26, s: S5b }],
  6: [{ f: 644, s: S6a }, { f: 704, cut: true, s: S6b }],
  7: [{ f: 748, s: S7a }, { f: 806, cut: true, s: S7b }],
  8: [{ f: 828, s: S8a }, { f: 926, cut: true, s: S8b }, { f: 979, cut: true, s: S8c }],
  9: [{ f: 1028, s: S9a }],
  10: [{ f: 1093, s: S10a }],
  11: [{ f: 1141, s: S11a }, { f: 1184, cut: true, s: S11b }, { f: 1229, cut: true, s: S11c }],
  12: [{ f: 1279, s: S12a }, { f: 1349, dur: 30, s: S12b }],
  13: [{ f: 1408, s: S13a }],
  14: [{ f: 1485, s: S14a }, { f: 1550, cut: true, s: S14b }, { f: 1609, cut: true, s: S14c }],
  15: [{ f: 1644, s: S15a }],
  16: [{ f: 1726, s: S16a }, { f: 1784, cut: true, s: S16b }, { f: 1828, cut: true, s: S16c }],
};

// impact kicks: the image offset flips sign every frame and decays over 7 f
export const STAMP_T = 1579 / FPS, SIGN_T = 1561 / FPS;
const KICKS: [number, number][] = [
  ...RIVETS.map((t) => [t, 0.45] as [number, number]), [818 / FPS, 1.2], [940 / FPS, 1.0], [990 / FPS, 1.4], [STAMP_T, 0.8],
];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens: depth of field ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 6 }, // hook: wave sharp, far street a little soft
  { f: 145, cInf: 0 }, // aerial + busy street
  { f: 235, cInf: 8, focus: () => [-24, 1.6, 6.5] },
  { f: 302, cInf: 0 }, // tank lows / wide
  { f: 447, cInf: 13, focus: () => tk(0.4, 0.75, 15.0) }, // kids at the base
  { f: 531, cInf: 0 }, // paint sweep, ship
  { f: 748, cInf: 14 }, // rivet seam CU (focus = look)
  { f: 806, cInf: 8 },
  { f: 828, cInf: 0 }, // wave, firehouse, el, aerial
  { f: 1093, cInf: 12, focus: () => [-28.6, 1.3, 9.2] }, // horse
  { f: 1145, cInf: 11, focus: () => [K[0], 1.0, K[2]] }, // kitchen
  { f: 1184, cInf: 14 },
  { f: 1283, cInf: 10, focus: () => [-13.2, 1.3, 7.2] }, // trapped people
  { f: 1408, cInf: 0 }, // the toll: wide, sharp
  { f: 1489, cInf: 11, focus: () => [O[0], 1.45, O[2] - 0.35] }, // engineer
  { f: 1550, cInf: 15 }, // desk insert, focus = look
  { f: 1609, cInf: 8, focus: () => [O[0], 1.3, O[2] - 0.3] },
  { f: 1648, cInf: 0 }, // hosing
  { f: 1731, cInf: 8, focus: () => [-20.4, 1.65, 9.2] }, // summer street
  { f: 1828, cInf: 0 }, // crane out
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};
/** frame at which the current key's move has finished */
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};
export const unusedRolled = rolled; // kept for later camera passes
