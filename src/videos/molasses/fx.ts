// Our own 2D drawings for the molasses short (same Pen, plum ink and flat fills as toon.ts): a draught horse in side
// view (wide card), molasses drips and squirts, the crack, a water spray arc, smell wiggles, the engineer's seal and
// signature, frost sparkles for the cold honey. Canvas sizes are given per drawing.
import { Pen, INK, mix, mul } from "./toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
export const MOL = "#5a2a12", MOL_L = "#8a4a22", MOL_HI = "#c07a3e";

/** draught horse facing screen-right on a 1200 x 1000 design card (soles at y = 975, 1000 units = 2.16 m).
 *  sink = how much of the legs is under the molasses (only changes the pose: head up, ears back); lid 0..1 blink. */
export const horseSide = (p: Pen, o: { col?: string; mane?: string; strain?: number; lid?: number; light?: number } = {}) => {
  const col = o.col ?? "#9a5b34", mane = o.mane ?? "#3b2418", k = o.strain ?? 0, lid = o.lid ?? 0;
  const dark = mul(col, [0.72, 0.7, 0.78]);
  const leg = (x0: number, y0: number, x1: number, far: boolean) => {
    const c = far ? dark : col;
    p.poly([[x0 - 26, y0], [x0 + 26, y0], [x1 + 18, 930], [x1 - 18, 930]], c, 9);
    p.poly([[x1 - 24, 930], [x1 + 24, 930], [x1 + 26, 975], [x1 - 26, 975]], "#3a2a24", 8); // hoof
  };
  // far legs, tail
  leg(380, 520, 372, true); leg(770, 520, 790, true);
  p.poly([[250, 360], [190, 420 + 30 * k], [170, 560], [205, 600], [232, 470]], mane, 9);
  // body
  const body: P2[] = [];
  for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; body.push([540 + 290 * Math.cos(a), 430 + 125 * Math.sin(a) * (Math.sin(a) > 0 ? 1.05 : 0.95)]); }
  p.gradFill(body, col, dark, o.light ?? rad(-120));
  p.poly(body, null, 11);
  // near legs
  leg(420, 530, 410, false); leg(740, 530, 750, false);
  // neck + head (lifted when straining)
  const hy = -40 * k;
  const neck: P2[] = [[700, 340], [790, 210 + hy], [880, 150 + hy], [935, 200 + hy], [880, 300 + hy], [830, 470], [730, 500]];
  p.poly(neck, col, 11);
  const head: P2[] = [[860, 150 + hy], [935, 128 + hy], [1060, 230 + hy], [1078, 290 + hy], [1040, 318 + hy], [960, 290 + hy], [880, 245 + hy]];
  p.poly(head, col, 11);
  p.ell(1050, 296 + hy, 26, 18, mix(col, "#2a1a14", 0.35), 6); // muzzle
  p.dot(1062, 290 + hy, 5);
  // ears
  p.poly([[890, 140 + hy], [880 - 25 * k, 70 + hy], [920, 128 + hy]], col, 8);
  p.poly([[915, 132 + hy], [915 - 20 * k, 66 + hy], [945, 132 + hy]], col, 8);
  // mane along the neck
  p.poly([[880, 140 + hy], [780, 200 + hy], [700, 330], [720, 345], [800, 225 + hy], [895, 168 + hy]], mane, 8);
  // eye: lidded, worried brow
  const ex = 958, ey = 200 + hy;
  if (lid > 0.7) p.stroke([[ex - 12, ey], [ex + 12, ey]], 6);
  else { p.ell(ex, ey, 11, 13 * (1 - 0.5 * lid), "#ffffff", 5); p.dot(ex + 3, ey + 2, 6); }
  p.stroke([[ex - 18, ey - 26 - 6 * k], [ex + 14, ey - 18]], 6);
  // harness collar
  p.poly([[760, 330], [800, 300], [850, 480], [800, 500]], "#3a2a24", 7);
};

/** molasses drip trail running down a wall on a 120 x 600 canvas; t = 0..1 phase of the falling drop */
export const fxDrip = (p: Pen, t: number) => {
  p.poly([[44, 0], [76, 0], [70, 300], [64, 420], [56, 420], [50, 300]], MOL, 6);
  const y = 430 + 150 * t;
  p.ell(60, y, 13, 18, MOL_L, 5);
  p.ell(55, y - 6, 4, 6, MOL_HI, 0);
};
/** puddle of molasses (top-down) on a 300 x 150 canvas */
export const fxPuddle = (p: Pen) => { p.ell(150, 75, 140, 60, MOL, 5); p.ell(118, 60, 52, 14, MOL_HI, 0); };

/** jagged crack running up the tank plate on a 300 x 900 canvas; u = 0..1 how far it has run (from the bottom) */
export const fxCrack = (p: Pen, u: number) => {
  const pts: P2[] = [[150, 900]];
  const n = 14;
  for (let i = 1; i <= n; i++) { const y = 900 - (i / n) * 880; if ((i - 1) / n > u) break; pts.push([150 + (i % 2 ? 34 : -30) * (0.6 + 0.4 * Math.sin(i * 2.1)), y]); }
  if (pts.length > 1) { p.stroke(pts, 30, INK); p.stroke(pts, 12, MOL); }
};
/** molasses spurting out of a split seam on a 600 x 400 canvas; t = 0..1 */
export const fxSquirt = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(-30 + i * 15), L = 120 + 360 * t * (0.7 + 0.3 * Math.sin(i * 3));
    const pts: P2[] = [];
    for (let k = 0; k <= 8; k++) { const s = (k / 8) * L; pts.push([40 + s * Math.cos(a), 200 + s * Math.sin(a) + 0.0016 * s * s * 60]); }
    p.line(pts, i % 2 ? MOL_L : MOL, 26 - i * 2);
  }
};
/** water jet arc from a nozzle on a 1000 x 500 canvas (nozzle at the left), soft white-blue */
export const fxSpray = (p: Pen, t: number) => {
  for (let k = 0; k < 3; k++) {
    const pts: P2[] = [];
    for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push([40 + 900 * u, 420 - 520 * u + 540 * u * u + 12 * Math.sin(u * 18 + t * 20 + k * 2)]); }
    p.line(pts, k ? "#d8eefc" : "#ffffff", 30 - 9 * k, k === 0);
  }
  for (let i = 0; i < 9; i++) { const u = 0.82 + 0.02 * i; p.ell(40 + 900 * u + 20 * Math.sin(i * 7 + t * 30), 420 - 520 * u + 540 * u * u - 20 + 18 * Math.cos(i * 5), 12, 12, "#ffffff", 5); }
};
/** three wavy smell lines rising on a 400 x 500 canvas; t phase */
export const fxSmell = (p: Pen, t: number) => {
  for (let k = 0; k < 3; k++) {
    const pts: P2[] = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([100 + k * 100 + 26 * Math.sin(u * 9 + t * 6 + k), 470 - 420 * u]); }
    p.line(pts, "#b36a2e", 12);
  }
};
/** engineer's seal (no text): red ring with a star on a 300 x 300 canvas */
export const fxSeal = (p: Pen) => {
  const g = p.g; g.globalAlpha = 0.9;
  g.strokeStyle = "#c8323a"; g.lineWidth = 16; g.beginPath(); g.arc(150, 150, 118, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 6; g.beginPath(); g.arc(150, 150, 92, 0, Math.PI * 2); g.stroke();
  const st: P2[] = [];
  for (let k = 0; k < 10; k++) { const r = k % 2 ? 26 : 62, a = rad(k * 36 - 90); st.push([150 + r * Math.cos(a), 150 + r * Math.sin(a)]); }
  p.poly(st, "#c8323a", 0);
  g.globalAlpha = 1;
};
/** ink signature squiggle on a 600 x 200 canvas, u = 0..1 written so far */
export const fxSign = (p: Pen, u: number) => {
  const pts: P2[] = [];
  const n = Math.max(2, Math.floor(60 * u));
  for (let i = 0; i <= n; i++) { const s = i / 60; pts.push([40 + 520 * s, 110 + 50 * Math.sin(s * 22) * (1 - s * 0.5) - 30 * Math.sin(s * 5)]); }
  p.stroke(pts, 9, "#1f2a6a");
};
/** frost sparkles on a 300 x 300 canvas */
export const fxFrost = (p: Pen, t: number) => {
  for (let i = 0; i < 6; i++) {
    const x = 50 + ((i * 97) % 200), y = 40 + ((i * 61) % 220), s = 18 + 10 * Math.sin(t * 5 + i * 2);
    p.stroke([[x - s, y], [x + s, y]], 7, "#ffffff"); p.stroke([[x, y - s], [x, y + s]], 7, "#ffffff");
    p.stroke([[x - s * 0.6, y - s * 0.6], [x + s * 0.6, y + s * 0.6]], 4, "#d8f0ff"); p.stroke([[x - s * 0.6, y + s * 0.6], [x + s * 0.6, y - s * 0.6]], 4, "#d8f0ff");
  }
};
/** warm steam curls on a 300 x 400 canvas */
export const fxSteam = (p: Pen, t: number) => {
  for (let k = 0; k < 2; k++) {
    const pts: P2[] = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([110 + k * 80 + 30 * Math.sin(u * 8 + t * 5 + k * 2), 380 - 340 * u]); }
    p.line(pts, "rgba(255,255,255,0.85)", 14, false);
  }
};
/** brown splash crown on an 800 x 800 canvas (molasses hitting a column / wall); t 0..1 */
export const fxMolSplash = (p: Pen, t: number) => {
  const c = 400, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
  if (rise > 0.02) {
    const pts: P2[] = [];
    for (let i = 0; i < 17; i++) { const h = (i % 2 ? 300 : 150) * rise * (0.7 + 0.3 * Math.sin(i * 1.7)); pts.push([c - 320 + (640 * i) / 16, 690 - h]); }
    p.poly([...pts, [c + 320, 720], [c - 320, 720]], MOL_L, 10);
  }
  for (let i = 0; i < 8; i++) {
    const a = rad(200 + i * 18), d = 120 + 360 * t, y = 640 + d * Math.sin(a) + 500 * t * t, r = 28 * (1 - t) + 8;
    if (t > 0.08 && y < 760) p.ell(c + d * Math.cos(a), y, r, r * 1.25, MOL, 7);
  }
};
