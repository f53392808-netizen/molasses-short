// Oopsonomics prop + label library (all ink-outlined, deterministic).
import { Pen, INK } from "../molasses/toon";
import { R, Pl, E, L, vgrad, glow, text } from "./sets";
import { coinGlyph, pizzaBox, pizzaTop, easeOut, clamp } from "./cast";
type G = CanvasRenderingContext2D;
type P2 = [number, number];
const rnd = (s: number, k: number) => { const x = Math.sin(s * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

/** 0..1 pop-in (ease-out, no overshoot) starting at tIn over d s; fades out at tOut */
export const pop = (lt: number, tIn: number, d = 0.28) => easeOut((lt - tIn) / d);
export const fade = (lt: number, tIn: number, tOut = 1e9, d = 0.25) => clamp((lt - tIn) / d) * (1 - clamp((lt - tOut) / d));
/** draw fn scaled about (x,y) by k (0 = hidden) */
export const at = (g: G, x: number, y: number, k: number, fn: () => void, alpha = 1) => {
  if (k <= 0.001 || alpha <= 0.001) return;
  g.save(); g.globalAlpha *= Math.min(1, alpha * (0.4 + 0.6 * k)); g.translate(x, y); g.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k); g.translate(-x, -y); fn(); g.restore();
};
/** ink label plate with white (or yellow) Montserrat Black text */
export const tag = (g: G, s: string, x: number, y: number, size: number, lt: number, tIn: number, tOut = 1e9, yellow = false, plate = INK) => {
  const k = pop(lt, tIn), a = 1 - clamp((lt - tOut) / 0.25);
  at(g, x, y, k, () => {
    g.save(); g.font = `900 ${size}px Mont, sans-serif`; const w = g.measureText(s).width; g.restore();
    R(g, x - w / 2 - size * 0.45, y - size * 0.72, w + size * 0.9, size * 1.44, plate, size * 0.08, size * 0.3);
    text(g, s, x, y + size * 0.04, size, yellow ? "#FFD21F" : "#ffffff", plate, "center", 0.0);
  }, a);
};
export const xMark = (g: G, x: number, y: number, s: number, k: number) => {
  if (k <= 0) return;
  const a = clamp(k * 2), b = clamp(k * 2 - 1);
  for (const [w, c] of [[s * 0.2, "#ffffff"], [s * 0.13, "#d42f2f"]] as [number, string][]) {
    L(g, [[x - s / 2, y - s / 2], [x - s / 2 + s * a, y - s / 2 + s * a]], w, c);
    if (b > 0) L(g, [[x + s / 2, y - s / 2], [x + s / 2 - s * b, y - s / 2 + s * b]], w, c);
  }
};
export const banknote = (g: G, x: number, y: number, w: number, col = "#8fc98a") => {
  R(g, x - w / 2, y - w * 0.24, w, w * 0.48, col, w * 0.03, w * 0.04); R(g, x - w * 0.42, y - w * 0.17, w * 0.84, w * 0.34, "rgba(0,0,0,0)", w * 0.012, w * 0.03);
  E(g, x, y, w * 0.12, w * 0.12, "#d6f0d0", w * 0.015); text(g, "$", x, y + w * 0.01, w * 0.16, "#3f7a3f", "", "center");
};
export const silverCoin = (g: G, x: number, y: number, r: number) => { E(g, x, y + r * 0.15, r, r, "#8a8f9a", r * 0.12); E(g, x, y, r, r, "#d6dae2", r * 0.12); E(g, x, y, r * 0.7, r * 0.7, null, r * 0.05); };
export const sandwich = (g: G, x: number, y: number, w: number) => {
  Pl(g, [[x - w / 2, y + w * 0.1], [x + w / 2, y + w * 0.1], [x + w * 0.46, y + w * 0.22], [x - w * 0.46, y + w * 0.22]], "#e8b56a", w * 0.03);
  L(g, [[x - w * 0.5, y + w * 0.06], [x - w * 0.3, y + w * 0.1], [x - w * 0.1, y + w * 0.04], [x + w * 0.1, y + w * 0.1], [x + w * 0.3, y + w * 0.04], [x + w * 0.5, y + w * 0.08]], w * 0.06, "#5fae4a");
  R(g, x - w * 0.48, y - w * 0.02, w * 0.96, w * 0.08, "#e86a5a", w * 0.025, w * 0.03);
  Pl(g, [[x - w * 0.5, y - w * 0.02], [x - w * 0.42, y - w * 0.22], [x + w * 0.42, y - w * 0.22], [x + w * 0.5, y - w * 0.02]], "#f0c47a", w * 0.03);
};
export const sock = (g: G, x: number, y: number, s: number) => {
  Pl(g, [[x - s * 0.18, y - s * 0.5], [x + s * 0.14, y - s * 0.5], [x + s * 0.14, y + s * 0.1], [x + s * 0.42, y + s * 0.22], [x + s * 0.4, y + s * 0.42], [x - s * 0.06, y + s * 0.42], [x - s * 0.18, y + s * 0.26]], "#f2ead8", s * 0.04);
  R(g, x - s * 0.18, y - s * 0.5, s * 0.32, s * 0.12, "#d42f2f", s * 0.03); R(g, x - s * 0.18, y - s * 0.32, s * 0.32, s * 0.06, "#d42f2f", 0);
};
export const fish = (g: G, x: number, y: number, s: number) => {
  Pl(g, [[x + s * 0.3, y], [x + s * 0.55, y - s * 0.2], [x + s * 0.55, y + s * 0.2]], "#7ab0d0", s * 0.04);
  E(g, x - s * 0.05, y, s * 0.4, s * 0.22, "#9fcbe6", s * 0.04); E(g, x - s * 0.28, y - s * 0.04, s * 0.04, s * 0.04, INK, 0);
};
export const gamepad = (g: G, x: number, y: number, s: number) => {
  R(g, x - s / 2, y - s * 0.2, s, s * 0.4, "#5a5f7a", s * 0.04, s * 0.18); R(g, x - s * 0.34, y - s * 0.04, s * 0.2, s * 0.07, INK, 0); R(g, x - s * 0.275, y - s * 0.11, s * 0.07, s * 0.2, INK, 0);
  E(g, x + s * 0.22, y - s * 0.05, s * 0.05, s * 0.05, "#e2603c", s * 0.02); E(g, x + s * 0.32, y + s * 0.05, s * 0.05, s * 0.05, "#ffd21f", s * 0.02);
};
export const houseIcon = (g: G, x: number, y: number, s: number) => { R(g, x - s * 0.4, y - s * 0.3, s * 0.8, s * 0.6, "#e9c79a", s * 0.04); Pl(g, [[x - s * 0.52, y - s * 0.28], [x, y - s * 0.7], [x + s * 0.52, y - s * 0.28]], "#a8443c", s * 0.04); R(g, x - s * 0.1, y, s * 0.2, s * 0.3, "#7a4b2a", s * 0.03); R(g, x + s * 0.16, y - s * 0.16, s * 0.16, s * 0.14, "#ffd77a", s * 0.025); };
export const carIcon = (g: G, x: number, y: number, s: number) => {
  Pl(g, [[x - s * 0.55, y + s * 0.1], [x - s * 0.5, y - s * 0.1], [x - s * 0.25, y - s * 0.14], [x - s * 0.12, y - s * 0.34], [x + s * 0.24, y - s * 0.34], [x + s * 0.38, y - s * 0.14], [x + s * 0.55, y - s * 0.08], [x + s * 0.55, y + s * 0.1]], "#3f86c8", s * 0.04);
  R(g, x - s * 0.06, y - s * 0.29, s * 0.14, s * 0.13, "#bfe8ff", s * 0.02); R(g, x + s * 0.11, y - s * 0.29, s * 0.14, s * 0.13, "#bfe8ff", s * 0.02);
  for (const dx of [-0.3, 0.3]) { E(g, x + s * dx, y + s * 0.12, s * 0.12, s * 0.12, "#2a2a33", s * 0.035); E(g, x + s * dx, y + s * 0.12, s * 0.05, s * 0.05, "#c9ccd2", 0); }
};
export const islandIcon = (g: G, x: number, y: number, s: number) => {
  E(g, x, y + s * 0.2, s * 0.55, s * 0.14, "#7ac8e6", s * 0.03); E(g, x, y + s * 0.14, s * 0.32, s * 0.1, "#f2d38a", s * 0.03);
  L(g, [[x, y + s * 0.12], [x + s * 0.06, y - s * 0.2], [x + s * 0.02, y - s * 0.42]], s * 0.07 + 6); L(g, [[x, y + s * 0.12], [x + s * 0.06, y - s * 0.2], [x + s * 0.02, y - s * 0.42]], s * 0.07, "#8a5a34");
  for (let i = 0; i < 5; i++) { const a = -Math.PI + (i / 4) * Math.PI; Pl(g, [[x + s * 0.02, y - s * 0.42], [x + s * 0.02 + Math.cos(a) * s * 0.32, y - s * 0.42 + Math.sin(a) * s * 0.14 + s * 0.12], [x + s * 0.02 + Math.cos(a + 0.2) * s * 0.2, y - s * 0.38 + Math.sin(a) * s * 0.1]], "#4f9a4a", s * 0.025); }
};
export const monitor = (g: G, x: number, y: number, w: number, h: number, inner: (sx: number, sy: number, sw: number, sh: number) => void, col = "#3a3a44") => {
  R(g, x - w * 0.12, y + h / 2 + w * 0.02, w * 0.24, w * 0.08, col, 5); R(g, x - w * 0.24, y + h / 2 + w * 0.09, w * 0.48, w * 0.03, col, 5);
  R(g, x - w / 2, y - h / 2, w, h, col, 7, 14);
  const sx = x - w / 2 + w * 0.04, sy = y - h / 2 + w * 0.04, sw = w * 0.92, sh = h - w * 0.08;
  g.save(); g.beginPath(); g.roundRect(sx, sy, sw, sh, 8); g.clip(); g.fillStyle = "#1e2a3a"; g.fillRect(sx, sy, sw, sh); inner(sx, sy, sw, sh); g.restore();
  g.lineWidth = 4; g.strokeStyle = INK; g.beginPath(); g.roundRect(sx, sy, sw, sh, 8); g.stroke();
};
export const chip = (g: G, x: number, y: number, s: number, label: string, t = 0) => {
  for (let i = 0; i < 6; i++) for (const sd of [-1, 1]) { R(g, x - s * 0.4 + i * s * 0.16 - s * 0.02 + s * 0.02, y + sd * s * 0.58 - s * 0.06, s * 0.06, s * 0.12, "#c9ccd2", 3); R(g, x + sd * s * 0.58 - s * 0.06, y - s * 0.4 + i * s * 0.16, s * 0.12, s * 0.06, "#c9ccd2", 3); }
  R(g, x - s / 2, y - s / 2, s, s, "#3a4a3a", 7, 12); R(g, x - s * 0.32, y - s * 0.32, s * 0.64, s * 0.64, "#4f6a4f", 4, 8);
  text(g, label, x, y, s * 0.22, "#ffffff", INK, "center", 0.1);
};
/** graphics card: board, two fans (spinning with t) */
export const gpu = (g: G, x: number, y: number, w: number, t = 0) => {
  R(g, x - w / 2, y - w * 0.2, w, w * 0.4, "#3a3a44", 7, 10); R(g, x - w / 2 + w * 0.06, y + w * 0.2, w * 0.4, w * 0.05, "#d9a441", 4);
  for (const dx of [-0.24, 0.24]) {
    const cx = x + dx * w; E(g, cx, y, w * 0.16, w * 0.16, "#22222a", 5);
    for (let k = 0; k < 5; k++) { const a = t * 12 + (k * Math.PI * 2) / 5; Pl(g, [[cx, y], [cx + Math.cos(a) * w * 0.14, y + Math.sin(a) * w * 0.14], [cx + Math.cos(a + 0.6) * w * 0.12, y + Math.sin(a + 0.6) * w * 0.12]], "#8a8f9a", 2); }
    E(g, cx, y, w * 0.035, w * 0.035, "#c9373a", 2);
  }
};
export const tower = (g: G, x: number, y: number, h: number, t = 0, glowOn = 0) => {
  if (glowOn > 0) glow(g, x, y - h * 0.5, h * 0.9, "rgba(120,220,255,A)", 0.35 * glowOn);
  R(g, x - h * 0.24, y - h, h * 0.48, h, vgrad(g, y - h, y, [[0, "#e0d8c0"], [1, "#b9b19a"]]), 7, 8);
  R(g, x - h * 0.17, y - h * 0.88, h * 0.34, h * 0.06, "#8f8872", 3); R(g, x - h * 0.17, y - h * 0.76, h * 0.34, h * 0.06, "#8f8872", 3);
  E(g, x, y - h * 0.38, h * 0.13, h * 0.13, "#4a4a4a", 5);
  for (let k = 0; k < 4; k++) { const a = t * 10 + (k * Math.PI) / 2; L(g, [[x, y - h * 0.38], [x + Math.cos(a) * h * 0.11, y - h * 0.38 + Math.sin(a) * h * 0.11]], 4, "#9a9a9a"); }
  E(g, x + h * 0.15, y - h * 0.12, h * 0.02, h * 0.02, glowOn > 0 ? "#5dff8a" : "#3a5a3a", 2);
};
export const clockIcon = (g: G, x: number, y: number, r: number, t: number) => {
  E(g, x, y, r, r, "#fff7e4", r * 0.08); for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; L(g, [[x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8], [x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9]], r * 0.04); }
  const a = -Math.PI / 2 + t * 1.2; L(g, [[x, y], [x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72]], r * 0.07); L(g, [[x, y], [x + Math.cos(a / 12) * r * 0.45, y + Math.sin(a / 12) * r * 0.45]], r * 0.09); E(g, x, y, r * 0.07, r * 0.07, INK, 0);
};
export const drum = (g: G, x: number, y: number, r: number, t: number) => {
  R(g, x - r * 0.1, y + r * 0.9, r * 0.2, r * 0.5, "#7a4b2a", 5); R(g, x - r * 0.6, y + r * 1.35, r * 1.2, r * 0.14, "#7a4b2a", 5, 6);
  E(g, x, y, r, r, "rgba(220,240,255,0.55)", 7);
  for (let i = 0; i < 9; i++) { const a = t * 2.2 + i * 2.3, d = r * (0.25 + 0.55 * rnd(3, i)); E(g, x + Math.cos(a) * d, y + Math.sin(a * 1.3) * d * 0.8, r * 0.13, r * 0.13, ["#e2603c", "#ffd21f", "#4f86b8", "#3f9a55"][i % 4], 4); }
  g.save(); g.globalAlpha = 0.5; E(g, x - r * 0.35, y - r * 0.4, r * 0.18, r * 0.1, "#ffffff", 0); g.restore();
  L(g, [[x + r, y], [x + r * 1.3, y], [x + r * 1.3, y + r * 0.4]], 10);
};
export const coinPile = (g: G, x: number, y: number, w: number, n: number, seed = 1) => {
  if (n <= 0) return;
  const b = Math.max(1, Math.ceil((Math.sqrt(8 * n + 1) - 1) / 2)), r = Math.min(w / (2 * b * 0.95), 40); let i = 0;
  for (let row = 0; row < b && i < n; row++) { const cnt = b - row, rw = cnt * 2 * r * 0.95;
    for (let c = 0; c < cnt && i < n; c++, i++) coinGlyph(g, x - rw / 2 + r + c * 2 * r * 0.95 + (rnd(seed, i) - 0.5) * r * 0.3, y - r - row * r * 1.25, r); }
};
export const boxStack = (g: G, x: number, y: number, w: number, n: number, k = 1) => {
  const p = new Pen(g); p.ol = 6;
  for (let i = 0; i < n; i++) { const kk = i === n - 1 ? k : 1; if (kk <= 0) continue; g.save(); const yy = y - w * 0.12 - i * w * 0.2 - (1 - kk) * 60; g.globalAlpha = kk; pizzaBox(p, x + (rnd(7, i) - 0.5) * w * 0.06, yy, w); g.restore(); }
};
export const bubble = (g: G, x: number, y: number, w: number, h: number, k: number, inner: () => void, tailX?: number, tailY?: number, thought = true) => {
  at(g, x, y, k, () => {
    if (thought && tailX !== undefined) { E(g, lerpN(tailX, x, 0.25), lerpN(tailY!, y + h / 2, 0.25), 10, 9, "#ffffff", 4); E(g, lerpN(tailX, x, 0.55), lerpN(tailY!, y + h / 2, 0.55), 17, 15, "#ffffff", 5); }
    if (!thought && tailX !== undefined) Pl(g, [[x - 30, y + h / 2 - 6], [tailX, tailY!], [x + 20, y + h / 2 - 6]], "#ffffff", 6);
    R(g, x - w / 2, y - h / 2, w, h, "#ffffff", 6, h * 0.45); inner();
  });
};
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
export const soldSign = (g: G, x: number, y: number, s: number, k: number) => at(g, x, y, k, () => {
  L(g, [[x, y + s * 0.3], [x, y + s * 1.2]], s * 0.06 + 8); L(g, [[x, y + s * 0.3], [x, y + s * 1.2]], s * 0.06, "#7a4b2a");
  R(g, x - s * 0.6, y - s * 0.3, s * 1.2, s * 0.6, "#d42f2f", 7, 10); text(g, "SOLD", x, y + s * 0.02, s * 0.36, "#ffffff", INK, "center", 0.08);
});
export const newspaper = (g: G, x: number, y: number, w: number) => {
  R(g, x - w / 2, y - w * 0.65, w, w * 1.3, "#f4f0e4", 6, 4); text(g, "NEWS", x, y - w * 0.52, w * 0.14, INK, "", "center");
  L(g, [[x - w * 0.44, y - w * 0.42], [x + w * 0.44, y - w * 0.42]], 4);
  R(g, x - w * 0.42, y - w * 0.36, w * 0.84, w * 0.5, "#e8dcc0", 4); const p = new Pen(g); p.ol = 3; pizzaTop(p, x, y - w * 0.11, w * 0.2);
  for (let i = 0; i < 5; i++) R(g, x - w * 0.42, y + w * 0.2 + i * w * 0.08, w * (0.84 - (i % 2) * 0.2), w * 0.035, "#b9b19a", 0);
};
export const pedestal = (g: G, x: number, y: number, w: number) => {
  R(g, x - w * 0.6, y - w * 0.12, w * 1.2, w * 0.12, "#e9e2d0", 6, 4); R(g, x - w * 0.45, y - w * 1.0, w * 0.9, w * 0.88, vgrad(g, y - w, y, [[0, "#f4efe2"], [1, "#d6cdb6"]]), 7);
  R(g, x - w * 0.6, y - w * 1.1, w * 1.2, w * 0.12, "#e9e2d0", 6, 4);
};
export const spot = (g: G, x: number, y: number, w: number, a = 0.25) => {
  const gr = g.createLinearGradient(0, 0, 0, y); gr.addColorStop(0, "rgba(255,245,210,0)"); gr.addColorStop(1, `rgba(255,245,210,${a})`);
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - w * 0.15, 0); g.lineTo(x + w * 0.15, 0); g.lineTo(x + w / 2, y); g.lineTo(x - w / 2, y); g.fill();
  E(g, x, y, w / 2, w * 0.08, `rgba(255,245,210,${a * 1.3})`, 0);
};
export const candle = (g: G, x: number, y: number, s: number, t: number) => {
  R(g, x - s * 0.08, y - s * 0.6, s * 0.16, s * 0.6, "#f2ead8", 4, 3); glow(g, x, y - s * 0.72, s * 0.5, "rgba(255,200,90,A)", 0.5);
  const f = 1 + 0.06 * Math.sin(t * 9); E(g, x, y - s * 0.72, s * 0.06, s * 0.12 * f, "#ffb02e", 3);
};
export const lightning = (g: G, x: number, y: number, s: number) => Pl(g, [[x + s * 0.1, y - s * 0.5], [x - s * 0.25, y + s * 0.05], [x, y + s * 0.05], [x - s * 0.1, y + s * 0.5], [x + s * 0.25, y - s * 0.08], [x, y - s * 0.08]], "#ffd21f", s * 0.06);
export const arrow = (g: G, x0: number, y0: number, x1: number, y1: number, k: number, w = 14, col = "#FFD21F") => {
  if (k <= 0) return; const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k, a = Math.atan2(y1 - y0, x1 - x0);
  L(g, [[x0, y0], [x, y]], w + 10); L(g, [[x0, y0], [x, y]], w, col);
  Pl(g, [[x + Math.cos(a) * w * 1.6, y + Math.sin(a) * w * 1.6], [x + Math.cos(a + 2.3) * w * 1.6, y + Math.sin(a + 2.3) * w * 1.6], [x + Math.cos(a - 2.3) * w * 1.6, y + Math.sin(a - 2.3) * w * 1.6]], col, 5);
};
export { coinGlyph, pizzaBox, pizzaTop, R, Pl, E, L, text, glow };
