// ep01 3D: character drawing with views (front / 3-4 "q" / side / back) and walk cycles from every angle.
// Based on oops/cast.ts drawChar (copied, not edited). Exactly two arms in every view (side view: near arm + far arm only when walking).
import { Pen, bodyFront, bodySide, FrontGeom, INK } from "../molasses/toon";
import { ARM, CharState, CharDef, blinkAt, coinGlyph, pizzaBox, laptop } from "../oops/cast";
type P2 = [number, number];
type ArmP = { e: P2; h: P2; front?: boolean; open?: boolean };
export type View = "front" | "q" | "side" | "back";
export const drawChar3 = (g: CanvasRenderingContext2D, c: CharDef, x: number, y: number, s: number, st: CharState, t: number, view: View = "front", vs = 1) => {
  const flip = view === "side" && vs < 0, walking = st.mode === "stroll" || st.mode === "march", back = view === "back";
  const br = st.breathe ?? 1, bob = br * Math.sin((t + c.seed) * 2 * Math.PI / 3.6);
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.translate(-300, -975 + bob * 1.2);
  const p = new Pen(g);
  let armL = st.armL ?? ARM[st.L ?? "down"], armR = st.armR ?? ARM[st.R ?? "down"];
  if (walking) { const sw = Math.sin(2 * Math.PI * (st.phase ?? 0)); const swing = (a: ArmP, k: number): ArmP => a.front ? a : { ...a, e: [a.e[0] - 3 * k, a.e[1] - 4 * k], h: [a.h[0] - 5 * k, a.h[1] - 10 * k] }; armL = swing(armL, sw); armR = swing(armR, -sw); }
  if (back) { const tmp = armL; armL = { ...armR, front: false }; armR = { ...tmp, front: false }; }
  const drawArm = (q: Pen, G: FrontGeom, a: ArmP, side: number) => {
    const S = G.sh(side), u = G.u, E: P2 = [S[0] + side * a.e[0] * u, S[1] + a.e[1] * u], H: P2 = [S[0] + side * a.h[0] * u, S[1] + a.h[1] * u];
    q.band(curveQ(S, E, H), G.armCol, 9.5 * u, 1.6 * u, "round");
    q.ell(H[0], H[1], 6.4 * u, 6.4 * u, G.skin, 1.6 * u);
    if (a.open) q.stroke([[H[0] + side * 3 * u, H[1] - 4 * u], [H[0] + side * 7.5 * u, H[1] - 6.5 * u]], 1.4 * u);
    return H;
  };
  const hand = (G: FrontGeom, a: ArmP, side: number): P2 => { const S = G.sh(side); return [S[0] + side * a.h[0] * G.u, S[1] + a.h[1] * G.u]; };
  const lid = st.blink ?? blinkAt(t, c.seed);
  if (view === "side") {
    bodySide(p, c.o, { mode: walking ? "march" : "stand", phase: st.phase ?? 0, expr: st.expr ?? "neutral", blink: lid, seed: c.seed, stride: 0.7, stomp: 0.7 });
    g.restore(); return;
  }
  bodyFront(p, c.o, {
    mode: st.mode === "sit" ? "sit" : walking ? "march" : "stand", phase: st.phase ?? 0, back, expr: st.expr ?? "neutral", look: st.look ?? 0, blink: lid, seed: c.seed,
    facing: view === "q" ? (vs < 0 ? -1 : 1) : (st.facing ?? 0),
    tilt: (st.tilt ?? 0) + 0.25 * br * Math.sin((t + c.seed) * 2 * Math.PI / 5.1), headTilt: st.headTilt ?? 0, noArms: true, talk: back ? 0 : (st.talk ?? 0),
    curl: 6 * Math.sin((t + c.seed * 0.3) * 2 * Math.PI / 2.4) + (st.headTilt ?? 0) * -1.2, tieSwing: 0.8 * Math.sin((t + 0.4) * 2 * Math.PI / 3.6),
    armsBehind: (q: Pen, G: FrontGeom) => {
      if (back && (st.prop === "box" || st.prop === "boxes")) { const u = G.u, n = st.prop === "boxes" ? (st.propN ?? 2) : 1; for (let i = n - 1; i >= 0; i--) pizzaBox(q, G.tcx, G.chin + 0.42 * G.HH - i * 17 * u, 92 * u); }
      if (!armL.front) drawArm(q, G, armL, -1); if (!armR.front) drawArm(q, G, armR, 1); },
    armsFront: (q: Pen, G: FrontGeom) => {
      if (back) return;
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
      if (st.prop === "note") { q.poly([[hp[0] - 4 * u, hp[1] - 30 * u], [hp[0] + 34 * u, hp[1] - 30 * u], [hp[0] + 34 * u, hp[1] - 8 * u], [hp[0] - 4 * u, hp[1] - 8 * u]], "#7fbf7a", 1.8 * u); q.ell(hp[0] + 15 * u, hp[1] - 19 * u, 6 * u, 6 * u, "#5a9a5a", 1.2 * u); q.ell(hp[0], hp[1], 6.4 * u, 6.4 * u, G.skin, 1.6 * u); }
      if ((st.prop as any) === "gpu") { q.poly([[hp[0] - 10 * u, hp[1] - 40 * u], [hp[0] + 56 * u, hp[1] - 40 * u], [hp[0] + 56 * u, hp[1] - 6 * u], [hp[0] - 10 * u, hp[1] - 6 * u]], "#2f7a4a", 1.8 * u); for (const fx of [10, 36]) { q.ell(hp[0] + fx * u, hp[1] - 23 * u, 11 * u, 11 * u, "#3a3a44", 1.4 * u); q.ell(hp[0] + fx * u, hp[1] - 23 * u, 3 * u, 3 * u, "#8a8f9a", 0.8 * u); } q.poly([[hp[0] + 2 * u, hp[1] - 6 * u], [hp[0] + 40 * u, hp[1] - 6 * u], [hp[0] + 40 * u, hp[1] - 1 * u], [hp[0] + 2 * u, hp[1] - 1 * u]], "#ffd21f", 1 * u); q.ell(hp[0], hp[1], 6.4 * u, 6.4 * u, G.skin, 1.6 * u); }
      if (st.prop === "mic") { q.band([[hp[0], hp[1] + 4 * u], [hp[0] + 8 * u, hp[1] - 22 * u]], "#3a3a44", 4 * u, 1.2 * u, "round"); q.ell(hp[0] + 9 * u, hp[1] - 26 * u, 6 * u, 6 * u, "#8a8f9a", 1.6 * u); q.ell(hp[0], hp[1], 6.4 * u, 6.4 * u, G.skin, 1.6 * u); }
    },
    faceExtra: (q: Pen, G: FrontGeom) => {
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
