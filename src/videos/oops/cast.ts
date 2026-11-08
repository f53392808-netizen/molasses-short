// Oopsonomics cast: reusable characters (Buck, Laszlo, Jeremy, driver, extras) built on the shared toon body system.
// Deadpan acting: face swaps, tiny head tilts, a breathing bob, blinks, simple talking mouth. Always exactly two arms:
// bodyFront is called with noArms and the two arms are drawn here from a small pose library (blended, eased).
import { Pen, bodyFront, bodySide, Outfit, Expr, FrontGeom, INK, mix, shade } from "../molasses/toon";

type P2 = [number, number];
export type CharDef = { name: string; o: Outfit; seed: number; glasses?: boolean; beard?: string };

export const BUCK: CharDef = { name: "buck", seed: 7, o: { jacket: "#d9a33a", pants: "#4a3b33", boots: "#2a1e1a", hat: "cap", cap: "#2f8a57", buttons: "#f4e3a1", skin: "#f5c9a0", build: "stout", tie: "#b8322c" } };
export const LASZLO: CharDef = { name: "laszlo", seed: 21, glasses: true, o: { jacket: "#4f86b8", pants: "#7a6650", boots: "#3a2a20", hat: "hair", hair: "#7a5236", skin: "#f7d2b4", top: "tee" } };
export const JEREMY: CharDef = { name: "jeremy", seed: 33, o: { jacket: "#cf5a3e", pants: "#3b4a6b", boots: "#ece6da", hat: "hair", hair: "#2a1e18", skin: "#efc39b", top: "hoodie" } };
export const DRIVER: CharDef = { name: "driver", seed: 45, o: { jacket: "#c8363a", pants: "#2f2f3a", boots: "#241a18", hat: "cap", cap: "#c8363a", skin: "#d9a67c", top: "polo" } };
const SK = ["#f7d2b4", "#efc39b", "#d9a67c", "#b98258", "#f5c9a0"];
const TOPS = ["#5b8f5a", "#7b5ac9", "#3f6fb5", "#d08a3a", "#2f7f86", "#b8506a", "#8a6a4a", "#4a5f8a"];
const HAIR = ["#2a1e18", "#5a3b2a", "#8a5a34", "#c9a050", "#3a2a20", "#6a6a6a"];
export const extra = (i: number): CharDef => {
  const kinds: Outfit["top"][] = ["tee", "hoodie", "polo", "suit"];
  const capped = i % 5 === 3;
  return { name: "extra" + i, seed: 100 + i * 7, glasses: i % 4 === 1,
    o: { jacket: TOPS[i % 8], pants: ["#3b3f52", "#4a4038", "#2f3a4a", "#5a4a3a"][i % 4], boots: "#2a201a", hat: capped ? "cap" : "hair",
      cap: TOPS[(i + 3) % 8], hair: HAIR[(i * 3) % 6], skin: SK[(i * 2 + 1) % 5], top: kinds[i % 4], tie: "#3a4a7a" } };
};

// ---------------- easing / timing ----------------
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (s: number, k: number) => { const x = Math.sin(s * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

/** blink lid 0..1 at time t (s); deterministic per seed, ~every 3-5 s, 0.15 s long */
export const blinkAt = (t: number, seed: number) => {
  const per = 3.2 + 1.6 * rnd(seed, 1), off = rnd(seed, 2) * per, k = Math.floor((t + off) / per), ph = (t + off) - k * per;
  const dur = 0.16, j = rnd(seed, k + 9) * 0.6; // jitter each cycle
  const x = (ph - j) / dur;
  if (x < 0 || x > 1) return 0;
  return x < 0.3 ? x / 0.3 : x < 0.6 ? 1 : (1 - x) / 0.4;
};

// ---------------- arm poses (offsets from the shoulder in u, right arm; left arm mirrors) ----------------
type ArmP = { e: P2; h: P2; front?: boolean; open?: boolean };
export const ARM: Record<string, ArmP> = {
  down: { e: [15, 45], h: [17, 86] },
  hip: { e: [34, 38], h: [12, 70] },
  point: { e: [32, -2], h: [64, -16], open: true },
  pointUp: { e: [26, -18], h: [36, -62], open: true },
  present: { e: [28, 34], h: [54, 22], open: true },
  wave: { e: [32, -14], h: [40, -58], open: true },
  shrug: { e: [28, 30], h: [46, 8], open: true },
  type: { e: [20, 46], h: [-8, 66], front: true },
  hold: { e: [24, 44], h: [-6, 52], front: true },
  holdLow: { e: [18, 50], h: [-4, 72], front: true },
  chin: { e: [18, 48], h: [-27, -6], front: true },
  coin: { e: [26, 40], h: [36, 12], front: true },
  cardOut: { e: [28, 30], h: [58, 14], front: true },
  rest: { e: [16, 46], h: [6, 84] },
  desk: { e: [26, 26], h: [12, 44], front: true },
  deskOut: { e: [26, 20], h: [14, 26], front: true },
  thumb: { e: [26, 36], h: [30, 6], front: true },
};
export type ArmName = keyof typeof ARM;

export type CharState = {
  expr?: Expr; L?: ArmName; R?: ArmName; tilt?: number; headTilt?: number; look?: number; facing?: -1 | 0 | 1;
  talk?: number; blink?: number; mode?: "stand" | "sit" | "stroll" | "march"; phase?: number;
  /** what the hands hold: drawn in front of the torso */
  prop?: null | "box" | "boxes" | "coin" | "card" | "laptop" | "trophy" | "phone" | "slice" | "mic" | "note";
  propN?: number; armL?: ArmP; armR?: ArmP; breathe?: number;
};

const mixArm = (a: ArmP, b: ArmP, t: number): ArmP => ({ e: [lerp(a.e[0], b.e[0], t), lerp(a.e[1], b.e[1], t)], h: [lerp(a.h[0], b.h[0], t), lerp(a.h[1], b.h[1], t)],
  front: t < 0.5 ? a.front : b.front, open: t < 0.5 ? a.open : b.open });

/** keyed acting timeline: keys [time(s), partial state]; arms/tilts ease over `bl` s, faces swap at the key */
export const act = (t: number, keys: [number, CharState][], bl = 0.45): CharState => {
  let s: CharState = { expr: "neutral", L: "down", R: "down", tilt: 0, headTilt: 0, look: 0 };
  let armL = ARM.down, armR = ARM.down, prevL = ARM.down, prevR = ARM.down, kL = -99, kR = -99, tilt0 = 0, ht0 = 0, kT = -99, kH = -99;
  for (const [kt, k] of keys) {
    if (kt > t) break;
    if (k.L && k.L !== s.L) { prevL = mixArm(prevL, armL, ease((kt - kL) / bl)); armL = ARM[k.L]; kL = kt; }
    if (k.R && k.R !== s.R) { prevR = mixArm(prevR, armR, ease((kt - kR) / bl)); armR = ARM[k.R]; kR = kt; }
    if (k.tilt !== undefined && k.tilt !== s.tilt) { tilt0 = lerp(tilt0, s.tilt!, ease((kt - kT) / bl)); kT = kt; }
    if (k.headTilt !== undefined && k.headTilt !== s.headTilt) { ht0 = lerp(ht0, s.headTilt!, ease((kt - kH) / bl)); kH = kt; }
    s = { ...s, ...k };
  }
  return { ...s, armL: mixArm(prevL, armL, ease((t - kL) / bl)), armR: mixArm(prevR, armR, ease((t - kR) / bl)),
    tilt: lerp(tilt0, s.tilt!, ease((t - kT) / bl)), headTilt: lerp(ht0, s.headTilt!, ease((t - kH) / bl)) };
};

// ---------------- props ----------------
export const coinGlyph = (g: CanvasRenderingContext2D, x: number, y: number, r: number, edge = true) => {
  if (edge) { g.beginPath(); g.ellipse(x, y + r * 0.16, r, r, 0, 0, Math.PI * 2); g.fillStyle = "#b57d12"; g.fill(); g.lineWidth = r * 0.14; g.strokeStyle = INK; g.stroke(); }
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = "#ffc93a"; g.fill(); g.lineWidth = r * 0.14; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.arc(x, y, r * 0.74, 0, Math.PI * 2); g.lineWidth = r * 0.06; g.strokeStyle = "#d99a1a"; g.stroke();
  g.save(); g.fillStyle = "#9a6408"; g.font = `900 ${r * 1.15}px Mont, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("B", x + r * 0.03, y + r * 0.06);
  g.fillRect(x - r * 0.2, y - r * 0.62, r * 0.09, r * 0.2); g.fillRect(x + r * 0.03, y - r * 0.62, r * 0.09, r * 0.2);
  g.fillRect(x - r * 0.2, y + r * 0.44, r * 0.09, r * 0.2); g.fillRect(x + r * 0.03, y + r * 0.44, r * 0.09, r * 0.2); g.restore();
};
/** closed pizza box (front-ish view) centred at x,y with width w; generic, no logo: a simple slice icon */
export const pizzaBox = (p: Pen, x: number, y: number, w: number, open = 0) => {
  const h = w * 0.2;
  p.poly([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], "#e7c38d", w * 0.022);
  p.poly([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w * 0.46, y - h * 0.9], [x - w * 0.46, y - h * 0.9]], "#f2d6a6", w * 0.022);
  p.poly([[x - w * 0.08, y - h * 0.28], [x + w * 0.08, y - h * 0.28], [x, y + h * 0.32]], "#e8a33a", w * 0.012);
  p.dot(x - w * 0.02, y - h * 0.08, w * 0.012, "#c63a2f"); p.dot(x + w * 0.025, y + h * 0.02, w * 0.01, "#c63a2f");
};
export const pizzaTop = (p: Pen, x: number, y: number, r: number, slices = 8) => {
  p.ell(x, y, r, r, "#d98c3a", r * 0.05);
  p.ell(x, y, r * 0.86, r * 0.86, "#f7c64a", r * 0.025);
  for (let i = 0; i < 9; i++) { const a = i * 2.39996, d = r * 0.58 * Math.sqrt((i + 0.5) / 9); p.ell(x + d * Math.cos(a), y + d * Math.sin(a), r * 0.11, r * 0.11, "#c63a2f", r * 0.02); }
  for (let i = 0; i < slices / 2; i++) { const a = (i * Math.PI * 2) / slices; p.stroke([[x - Math.cos(a) * r * 0.86, y - Math.sin(a) * r * 0.86], [x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86]], r * 0.02, "rgba(120,60,20,0.5)"); }
};
const laptop = (p: Pen, x: number, y: number, w: number, glow = "#9fe0ff") => {
  p.poly([[x - w * 0.42, y - w * 0.58], [x + w * 0.42, y - w * 0.58], [x + w * 0.42, y - w * 0.02], [x - w * 0.42, y - w * 0.02]], "#5a5f6a", w * 0.03);
  p.poly([[x - w * 0.36, y - w * 0.52], [x + w * 0.36, y - w * 0.52], [x + w * 0.36, y - w * 0.08], [x - w * 0.36, y - w * 0.08]], glow, w * 0.015);
  p.poly([[x - w * 0.5, y], [x + w * 0.5, y], [x + w * 0.44, y + w * 0.08], [x - w * 0.44, y + w * 0.08]], "#8a8f9a", w * 0.03);
};

// ---------------- drawing ----------------
/** draw a character with feet at (x, y) in canvas px, scale s (1 = 1000 design units tall), at time t (s) */
export const drawChar = (g: CanvasRenderingContext2D, c: CharDef, x: number, y: number, s: number, st: CharState, t: number, flip = false) => {
  const br = st.breathe ?? 1, bob = br * Math.sin((t + c.seed) * 2 * Math.PI / 3.6);
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.translate(-300, -975 + bob * 1.2);
  const p = new Pen(g);
  const armL = st.armL ?? ARM[st.L ?? "down"], armR = st.armR ?? ARM[st.R ?? "down"];
  const drawArm = (q: Pen, G: FrontGeom, a: ArmP, side: number) => {
    const S = G.sh(side), u = G.u, E: P2 = [S[0] + side * a.e[0] * u, S[1] + a.e[1] * u], H: P2 = [S[0] + side * a.h[0] * u, S[1] + a.h[1] * u];
    q.band(curveQ(S, E, H), G.armCol, 9.5 * u, 1.6 * u, "round");
    q.ell(H[0], H[1], 6.4 * u, 6.4 * u, G.skin, 1.6 * u);
    if (a.open) q.stroke([[H[0] + side * 3 * u, H[1] - 4 * u], [H[0] + side * 7.5 * u, H[1] - 6.5 * u]], 1.4 * u);
    return H;
  };
  const hand = (G: FrontGeom, a: ArmP, side: number): P2 => { const S = G.sh(side); return [S[0] + side * a.h[0] * G.u, S[1] + a.h[1] * G.u]; };
  const lid = st.blink ?? blinkAt(t, c.seed);
  if (st.mode === "stroll" || st.mode === "march") {
    bodySide(p, c.o, { mode: "march", phase: st.phase ?? 0, expr: st.expr ?? "neutral", blink: lid, seed: c.seed, stride: 0.7, stomp: 0.7 });
    g.restore(); return;
  }
  bodyFront(p, c.o, {
    mode: st.mode === "sit" ? "sit" : "stand", expr: st.expr ?? "neutral", look: st.look ?? 0, blink: lid, seed: c.seed, facing: st.facing ?? 0,
    tilt: (st.tilt ?? 0) + 0.25 * br * Math.sin((t + c.seed) * 2 * Math.PI / 5.1), headTilt: st.headTilt ?? 0, noArms: true, talk: st.talk ?? 0,
    curl: 6 * Math.sin((t + c.seed * 0.3) * 2 * Math.PI / 2.4) + (st.headTilt ?? 0) * -1.2, tieSwing: 0.8 * Math.sin((t + 0.4) * 2 * Math.PI / 3.6),
    armsBehind: (q, G) => { if (!armL.front) drawArm(q, G, armL, -1); if (!armR.front) drawArm(q, G, armR, 1); },
    armsFront: (q, G) => {
      const u = G.u, hl = hand(G, armL, -1), hr = hand(G, armR, 1), cx = (hl[0] + hr[0]) / 2, cy = (hl[1] + hr[1]) / 2;
      if (st.prop === "box" || st.prop === "boxes") { const n = st.prop === "boxes" ? (st.propN ?? 2) : 1; for (let i = n - 1; i >= 0; i--) pizzaBox(q, cx, cy - 4 * u - i * 17 * u, 92 * u); }
      if (st.prop === "laptop") laptop(q, cx, cy - 2 * u, 80 * u);
      if (armL.front) drawArm(q, G, armL, -1);
      if (armR.front) drawArm(q, G, armR, 1);
      const hp = armR.front ? hr : armL.front ? hl : hr;
      if (st.prop === "coin") coinGlyph(q.g, hp[0], hp[1] - 13 * u, 15 * u);
      if (st.prop === "card") { q.poly([[hp[0] - 6 * u, hp[1] - 26 * u], [hp[0] + 26 * u, hp[1] - 26 * u], [hp[0] + 26 * u, hp[1] - 6 * u], [hp[0] - 6 * u, hp[1] - 6 * u]], "#3f7fd0", 1.8 * u); q.poly([[hp[0] - 6 * u, hp[1] - 21 * u], [hp[0] + 26 * u, hp[1] - 21 * u], [hp[0] + 26 * u, hp[1] - 17 * u], [hp[0] - 6 * u, hp[1] - 17 * u]], INK, 0); q.ell(hp[0], hp[1], 6.4 * u, 6.4 * u, G.skin, 1.6 * u); }
      if (st.prop === "phone") { q.poly([[hp[0] - 8 * u, hp[1] - 34 * u], [hp[0] + 8 * u, hp[1] - 34 * u], [hp[0] + 8 * u, hp[1] - 2 * u], [hp[0] - 8 * u, hp[1] - 2 * u]], "#2a2a33", 1.8 * u); q.poly([[hp[0] - 5.5 * u, hp[1] - 31 * u], [hp[0] + 5.5 * u, hp[1] - 31 * u], [hp[0] + 5.5 * u, hp[1] - 7 * u], [hp[0] - 5.5 * u, hp[1] - 7 * u]], "#ffd21f", 0); q.ell(hp[0], hp[1], 6.4 * u, 6.4 * u, G.skin, 1.6 * u); }
      if (st.prop === "trophy") { const tx = cx, ty = cy - 30 * u; q.poly([[tx - 18 * u, ty - 22 * u], [tx + 18 * u, ty - 22 * u], [tx + 10 * u, ty + 6 * u], [tx - 10 * u, ty + 6 * u]], "#ffc93a", 2 * u); q.poly([[tx - 4 * u, ty + 6 * u], [tx + 4 * u, ty + 6 * u], [tx + 4 * u, ty + 18 * u], [tx - 4 * u, ty + 18 * u]], "#d99a1a", 1.6 * u); q.poly([[tx - 14 * u, ty + 18 * u], [tx + 14 * u, ty + 18 * u], [tx + 14 * u, ty + 26 * u], [tx - 14 * u, ty + 26 * u]], "#7a4b2a", 1.6 * u); for (const sd of [-1, 1]) q.ell(hl[0] * (sd < 0 ? 1 : 0) + hr[0] * (sd > 0 ? 1 : 0), (sd < 0 ? hl : hr)[1], 6.4 * u, 6.4 * u, G.skin, 1.6 * u); }
      if (st.prop === "slice") { q.poly([[hp[0] - 4 * u, hp[1] - 4 * u], [hp[0] + 24 * u, hp[1] - 30 * u], [hp[0] + 30 * u, hp[1] - 18 * u]], "#f7c64a", 1.6 * u); q.stroke([[hp[0] + 24 * u, hp[1] - 30 * u], [hp[0] + 30 * u, hp[1] - 18 * u]], 4 * u, "#d98c3a"); q.dot(hp[0] + 16 * u, hp[1] - 18 * u, 2.5 * u, "#c63a2f"); q.ell(hp[0], hp[1], 6.4 * u, 6.4 * u, G.skin, 1.6 * u); }
      if (st.prop === "mic") { q.band([[hp[0], hp[1] + 4 * u], [hp[0] + 8 * u, hp[1] - 22 * u]], "#3a3a44", 4 * u, 1.2 * u, "round"); q.ell(hp[0] + 9 * u, hp[1] - 26 * u, 6 * u, 6 * u, "#8a8f9a", 1.6 * u); q.ell(hp[0], hp[1], 6.4 * u, 6.4 * u, G.skin, 1.6 * u); }
    },
    faceExtra: (q, G) => {
      const u = G.u, fx = 300 + 7 * u * G.facing;
      if (c.beard) { q.g.save(); q.g.globalAlpha = 0.35; q.ell(300 + 8 * u * G.facing, G.hc + 22 * u, 30 * u, 16 * u, c.beard, 0, 0, 180); q.g.restore(); }
      if (c.glasses) {
        for (const sd of [-1, 1]) q.ell(fx + sd * 13 * u, G.hc, 10.5 * u, 9.5 * u, null, 2.4 * u);
        q.stroke([[fx - 2.5 * u, G.hc - u], [fx + 2.5 * u, G.hc - u]], 2.2 * u);
      }
    },
  } as any);
  g.restore();
};
const curveQ = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, s = 1 - t; out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]); }
  return out;
};
export { laptop, mix, shade };
