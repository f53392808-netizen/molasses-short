// Oopsonomics reusable backgrounds. Every set is drawn ONCE (seeded, deterministic) into a cached canvas at 1.5x and
// then only transformed by the camera, so buildings and props can never flicker or shift between frames.
// World space = 1920 x 1080. Each set: bg (behind characters), optional fg (in front), a key light + vignette.
import { Pen, INK } from "../molasses/toon";
import { pizzaTop, coinGlyph } from "./cast";

type G = CanvasRenderingContext2D;
type P2 = [number, number];
const rnd = (s: number, k: number) => { const x = Math.sin(s * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const R = (g: G, x: number, y: number, w: number, h: number, fill: string | CanvasGradient, lw = 6, r = 0) => {
  g.beginPath(); if (r) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
  g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
};
const Pl = (g: G, pts: P2[], fill: string | CanvasGradient | null, lw = 6) => {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
};
const E = (g: G, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient | null, lw = 6) => {
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); }
};
const L = (g: G, pts: P2[], w: number, col: string = INK) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineWidth = w; g.strokeStyle = col; g.lineCap = "round"; g.lineJoin = "round"; g.stroke(); };
const vgrad = (g: G, y0: number, y1: number, stops: [number, string][]) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
const glow = (g: G, x: number, y: number, r: number, col: string, a: number) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace("A", String(a))); gr.addColorStop(1, col.replace("A", "0"));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
};
export const text = (g: G, s: string, x: number, y: number, size: number, fill = "#ffffff", stroke = INK, align: CanvasTextAlign = "center", sw = 0.16) => {
  g.save(); g.font = `900 ${size}px Mont, sans-serif`; g.textAlign = align; g.textBaseline = "middle"; g.lineJoin = "round";
  if (stroke) { g.lineWidth = size * sw; g.strokeStyle = stroke; g.strokeText(s, x, y); }
  g.fillStyle = fill; g.fillText(s, x, y); g.restore();
};
const plant = (g: G, x: number, y: number, s = 1) => {
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32; Pl(g, [[x, y - 70 * s], [x + Math.cos(a - 0.12) * 150 * s, y - 70 * s + Math.sin(a - 0.12) * 150 * s], [x + Math.cos(a) * 190 * s, y - 70 * s + Math.sin(a) * 190 * s], [x + Math.cos(a + 0.12) * 150 * s, y - 70 * s + Math.sin(a + 0.12) * 150 * s]], i % 2 ? "#4f8a4a" : "#3f7a3f", 4); }
  Pl(g, [[x - 55 * s, y - 90 * s], [x + 55 * s, y - 90 * s], [x + 42 * s, y], [x - 42 * s, y]], "#c0663a", 6);
};
const palm = (g: G, x: number, y: number, h: number, col: string, lw = 5) => {
  L(g, [[x, y], [x + h * 0.08, y - h * 0.5], [x + h * 0.02, y - h]], h * 0.06 + lw * 2, INK); L(g, [[x, y], [x + h * 0.08, y - h * 0.5], [x + h * 0.02, y - h]], h * 0.06, col);
  for (let i = 0; i < 7; i++) { const a = -Math.PI + (i / 6) * Math.PI, tx = x + h * 0.02, ty = y - h;
    Pl(g, [[tx, ty], [tx + Math.cos(a - 0.15) * h * 0.3, ty + Math.sin(a - 0.15) * h * 0.22 + h * 0.06], [tx + Math.cos(a) * h * 0.42, ty + Math.sin(a) * h * 0.24 + h * 0.16], [tx + Math.cos(a + 0.12) * h * 0.3, ty + Math.sin(a + 0.12) * h * 0.2 + h * 0.08]], col, lw); }
};
const books = (g: G, x0: number, x1: number, yb: number, seed: number) => {
  const cols = ["#3f6f8a", "#a8443c", "#d9a441", "#4f7a4a", "#7a5a8a", "#c46a3a"];
  let x = x0; for (let i = 0; x < x1 - 14; i++) { const w = 16 + Math.floor(rnd(seed, i) * 4) * 4, h = 60 + Math.floor(rnd(seed, i + 50) * 3) * 12; if (x + w > x1) break; R(g, x, yb - h, w, h, cols[(i + seed) % 6], 3); x += w + 2; }
};
const windowFrame = (g: G, x: number, y: number, w: number, h: number, sky: CanvasGradient, inner?: (g: G) => void) => {
  R(g, x - 16, y - 16, w + 32, h + 32, "#f2ead8", 6, 6);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = sky; g.fillRect(x, y, w, h); inner?.(g); g.restore();
  g.lineWidth = 6; g.strokeStyle = INK; g.strokeRect(x, y, w, h);
  R(g, x + w / 2 - 6, y, 12, h, "#f2ead8", 4); R(g, x, y + h * 0.45 - 6, w, 12, "#f2ead8", 4);
};
const floorBoards = (g: G, y0: number, c0: string, c1: string) => {
  g.fillStyle = vgrad(g, y0, 1080, [[0, c0], [1, c1]]); g.fillRect(0, y0, 1920, 1080 - y0);
  for (let i = 1; i < 6; i++) L(g, [[0, y0 + i * i * 7 + i * 10], [1920, y0 + i * i * 7 + i * 10]], 2.5, "rgba(40,20,10,0.25)");
  L(g, [[0, y0], [1920, y0]], 6);
};
const crt = (g: G, x: number, y: number, w: number) => { // beige 2010 CRT; screen rect = (x+0.09w, y+0.08w, 0.82w, 0.62w)
  Pl(g, [[x + w * 0.12, y + w * 0.78], [x + w * 0.88, y + w * 0.78], [x + w * 0.8, y + w * 0.95], [x + w * 0.2, y + w * 0.95]], "#b9b19a", 6);
  R(g, x, y, w, w * 0.8, vgrad(g, y, y + w * 0.8, [[0, "#ece5cf"], [1, "#c9c1a8"]]), 7, w * 0.04);
  R(g, x + w * 0.07, y + w * 0.06, w * 0.86, w * 0.66, "#8f8872", 4, w * 0.03);
  R(g, x + w * 0.42, y + w * 0.74, w * 0.16, w * 0.025, "#8f8872", 2); E(g, x + w * 0.86, y + w * 0.755, w * 0.015, w * 0.015, "#5dd36a", 2);
};
export const CRT_SCREEN = (x: number, y: number, w: number) => ({ x: x + w * 0.09, y: y + w * 0.08, w: w * 0.82, h: w * 0.62 });

export type SetDef = { bg: (g: G) => void; fg?: (g: G) => void; vig: number; key: [number, number]; tint?: string };

// ---- 1. Buck's host set: warm studio, chart poster, shelf with piggy bank and coin jar, plant, floor lamp ----
const host: SetDef = { vig: 0.42, key: [520, 260], bg: (g) => {
  g.fillStyle = vgrad(g, 0, 900, [[0, "#f6dfb0"], [1, "#e9b97c"]]); g.fillRect(0, 0, 1920, 1080);
  for (let x = 30; x < 1920; x += 80) { g.fillStyle = "rgba(160,90,40,0.07)"; g.fillRect(x, 0, 26, 700); }
  R(g, -10, 690, 1940, 220, vgrad(g, 690, 910, [[0, "#c2683e"], [1, "#9c4f2f"]]), 6);
  for (let x = 60; x < 1920; x += 240) R(g, x, 722, 190, 150, "rgba(255,255,255,0.06)", 3, 8);
  R(g, -10, 680, 1940, 22, "#e9d3a8", 6);
  floorBoards(g, 905, "#8a5a36", "#5e3a24");
  // chart poster (left)
  R(g, 170, 170, 420, 300, "#fff7e4", 7, 10);
  for (let i = 1; i < 5; i++) L(g, [[200, 190 + i * 55], [560, 190 + i * 55]], 2, "rgba(53,31,34,0.15)");
  L(g, [[205, 430], [270, 400], [330, 415], [390, 330], [450, 350], [510, 240], [555, 210]], 14); L(g, [[205, 430], [270, 400], [330, 415], [390, 330], [450, 350], [510, 240], [555, 210]], 8, "#3f9a55");
  Pl(g, [[555, 196], [575, 222], [540, 225]], "#3f9a55", 4);
  // shelf (right)
  R(g, 1330, 330, 420, 22, "#7a4b2a", 6); R(g, 1360, 352, 16, 40, "#5e3a24", 4); R(g, 1704, 352, 16, 40, "#5e3a24", 4);
  books(g, 1350, 1500, 330, 3);
  E(g, 1590, 290, 62, 44, "#f2a0a8", 6); E(g, 1640, 278, 16, 14, "#f2a0a8", 5); R(g, 1572, 252, 30, 6, INK, 0); L(g, [[1560, 330], [1556, 345]], 10); L(g, [[1620, 330], [1624, 345]], 10); E(g, 1628, 280, 3, 3, INK, 0);
  R(g, 1680, 240, 54, 90, "rgba(200,230,240,0.55)", 5, 10); for (let i = 0; i < 4; i++) E(g, 1696 + (i % 2) * 20, 318 - i * 16, 13, 6, "#ffc93a", 3);
  // floor lamp (left) + plant (right)
  R(g, 98, 330, 14, 580, "#5e3a24", 4); Pl(g, [[40, 330], [170, 330], [140, 220], [70, 220]], "#f6e7c4", 6); E(g, 105, 912, 60, 12, "#5e3a24", 5);
  plant(g, 1790, 905, 1.2);
} };

// ---- 2. Laszlo's 2010 home office (Jacksonville): window with palm, poster, shelf; desk + beige CRT in front ----
export const OFFICE_CRT = { x: 1130, y: 380, w: 470 };
const office: SetDef = { vig: 0.45, key: [400, 200], bg: (g) => {
  g.fillStyle = vgrad(g, 0, 800, [[0, "#d9e0b8"], [1, "#b9c493"]]); g.fillRect(0, 0, 1920, 1080);
  windowFrame(g, 150, 150, 360, 330, vgrad(g, 150, 480, [[0, "#f3a86a"], [1, "#ffd99a"]]), (q) => { palm(q, 420, 520, 300, "#4a6a3a", 4); E(q, 230, 330, 34, 34, "#fff1c2", 0); });
  R(g, 640, 170, 220, 280, "#3f5a8a", 6, 6); E(g, 750, 290, 60, 60, "#ffc93a", 5); L(g, [[700, 400], [800, 400]], 8, "#f2ead8");
  R(g, 1480, 160, 300, 18, "#7a4b2a", 5); books(g, 1495, 1760, 160, 11);
  R(g, -10, 740, 1940, 12, "#9aa676", 0);
  g.fillStyle = "#8a7a5a"; g.fillRect(0, 750, 1920, 330);
}, fg: (g) => {
  R(g, 160, 700, 1600, 60, vgrad(g, 700, 760, [[0, "#a87448"], [1, "#7e5232"]]), 7, 6);
  R(g, 200, 760, 1520, 330, vgrad(g, 760, 1080, [[0, "#6e4a30"], [1, "#4a3020"]]), 7);
  for (let i = 0; i < 3; i++) R(g, 260 + i * 500, 800, 420, 120, "rgba(255,255,255,0.05)", 3, 8);
  crt(g, OFFICE_CRT.x, OFFICE_CRT.y - 60, OFFICE_CRT.w);
  R(g, 640, 676, 360, 34, "#e0d8c0", 5, 6); for (let i = 0; i < 9; i++) R(g, 656 + i * 38, 683, 30, 9, "#c4bba0", 2, 2); for (let i = 0; i < 9; i++) R(g, 656 + i * 38, 695, 30, 9, "#c4bba0", 2, 2);
  R(g, 280, 470, 170, 240, vgrad(g, 470, 710, [[0, "#e0d8c0"], [1, "#b9b19a"]]), 7, 8); R(g, 300, 500, 130, 14, "#8f8872", 3); R(g, 300, 530, 130, 14, "#8f8872", 3); E(g, 365, 640, 38, 38, "#4a4a4a", 5);
  E(g, 1060, 690, 40, 16, "#e8e2d6", 5);
} };

// ---- 3. Jeremy's room (California): purple walls, posters, bed, night window; desk in front ----
const room: SetDef = { vig: 0.45, key: [1500, 220], bg: (g) => {
  g.fillStyle = vgrad(g, 0, 800, [[0, "#8a83c6"], [1, "#6a63a8"]]); g.fillRect(0, 0, 1920, 1080);
  windowFrame(g, 1380, 140, 360, 320, vgrad(g, 140, 460, [[0, "#1d2a5a"], [1, "#3a4f8c"]]), (q) => { for (let i = 0; i < 18; i++) E(q, 1390 + rnd(5, i) * 340, 150 + rnd(6, i) * 200, 2.5, 2.5, "#fff6c8", 0); E(q, 1660, 210, 26, 26, "#fff1c2", 0); });
  R(g, 220, 160, 230, 300, "#e2603c", 6, 6); for (let i = 0; i < 3; i++) E(g, 335, 240 + i * 70, 70 - i * 15, 22, ["#ffd21f", "#f6a35c", "#ffe9b0"][i], 4);
  R(g, 520, 200, 200, 200, "#2f7f86", 6, 6); Pl(g, [[620, 230], [690, 370], [550, 370]], "#ffd21f", 5);
  R(g, 860, 150, 280, 18, "#4a3a6a", 5); books(g, 880, 1120, 150, 23);
  g.fillStyle = "#5a5490"; g.fillRect(0, 750, 1920, 330); L(g, [[0, 750], [1920, 750]], 6);
}, fg: (g) => {
  R(g, 200, 700, 1520, 60, vgrad(g, 700, 760, [[0, "#f0e6d6"], [1, "#d6c8b0"]]), 7, 6);
  R(g, 240, 760, 1440, 330, vgrad(g, 760, 1080, [[0, "#c9b89a"], [1, "#9a8a70"]]), 7);
  R(g, 300, 600, 140, 100, "#3a3a44", 6, 10); E(g, 370, 650, 30, 30, "#ffd21f", 4);
  E(g, 1500, 690, 34, 14, "#e2603c", 5); L(g, [[1530, 690], [1600, 640], [1650, 700]], 5);
} };

// ---- 4. generic pizza shop (no real brand): brick oven, PIZZA sign, menu boards with icons, counter in front ----
const shop: SetDef = { vig: 0.4, key: [900, 150], bg: (g) => {
  g.fillStyle = "#f4ead6"; g.fillRect(0, 0, 1920, 1080);
  for (let y = 0; y < 760; y += 60) for (let x = (y / 60) % 2 ? -40 : 0; x < 1920; x += 80) R(g, x, y, 80, 60, (x / 80 + y / 60) % 2 ? "#f4ead6" : "#ece0c8", 1.5);
  // oven
  Pl(g, [[180, 760], [180, 380], [300, 250], [560, 250], [680, 380], [680, 760]], "#b5553a", 7);
  for (let y = 300; y < 760; y += 36) for (let x = 190 + ((y / 36) % 2) * 30; x < 670; x += 60) R(g, x, y, 56, 32, "rgba(0,0,0,0.06)", 1.5);
  g.beginPath(); g.ellipse(430, 600, 170, 140, 0, Math.PI, 0); g.lineTo(600, 700); g.lineTo(260, 700); g.closePath(); g.fillStyle = "#2a1410"; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
  glow(g, 430, 650, 170, "rgba(255,150,40,A)", 0.85);
  // PIZZA sign
  R(g, 820, 110, 520, 170, "#c8363a", 8, 24); R(g, 840, 130, 480, 130, "#a82a2e", 3, 16);
  text(g, "PIZZA", 1080, 198, 112, "#ffd21f", INK, "center", 0.12);
  // menu boards with icons only
  for (let i = 0; i < 3; i++) { const x = 780 + i * 210; R(g, x, 330, 190, 150, "#3a2f2a", 6, 8); const p = new Pen(g); p.ol = 3; pizzaTop(p, x + 95, 405, 48); }
  R(g, 1500, 300, 300, 20, "#7a4b2a", 5); for (let i = 0; i < 5; i++) R(g, 1530, 280 - i * 26 + 0, 220, 22, "#e7c38d", 4, 3);
  g.fillStyle = "#c9b896"; g.fillRect(0, 760, 1920, 320);
}, fg: (g) => {
  R(g, -10, 720, 1940, 50, "#f2ead8", 7);
  R(g, -10, 770, 1940, 320, "#c8363a", 7);
  for (let x = -10; x < 1940; x += 120) R(g, x, 770, 60, 320, "#f2ead8", 0);
  L(g, [[-10, 770], [1930, 770]], 7); R(g, 1380, 640, 170, 90, "#3a3a44", 6, 10); R(g, 1400, 655, 130, 40, "#9fe0ff", 4);
} };

// ---- 5. Jacksonville street at evening: sunset sky, palms, three houses (Laszlo's on the right), sidewalk, lamp ----
const house = (g: G, x: number, w: number, base: number, wall: string, roof: string, seed: number, porch = false) => {
  const h = w * 0.42;
  R(g, x, base - h, w, h, wall, 7);
  Pl(g, [[x - 40, base - h + 4], [x + w / 2, base - h - w * 0.26], [x + w + 40, base - h + 4]], roof, 7);
  const dx = x + w * (porch ? 0.62 : 0.5) - 45; R(g, dx, base - 190, 90, 190, "#7a4b2a", 6, 4); E(g, dx + 72, base - 95, 6, 6, "#ffd21f", 3);
  for (const wx of [x + w * 0.12, x + w * (porch ? 0.3 : 0.74)]) { R(g, wx, base - h + 60, 120, 100, "#ffd77a", 6); L(g, [[wx + 60, base - h + 60], [wx + 60, base - h + 160]], 4); L(g, [[wx, base - h + 110], [wx + 120, base - h + 110]], 4); }
  if (porch) { glow(g, dx + 45, base - 210, 120, "rgba(255,220,140,A)", 0.55); E(g, dx + 45, base - 215, 12, 12, "#fff1c2", 4); R(g, dx - 30, base - 8, 150, 16, "#b9a88a", 5); }
};
const street: SetDef = { vig: 0.5, key: [300, 650], bg: (g) => {
  g.fillStyle = vgrad(g, 0, 760, [[0, "#3a3270"], [0.45, "#a0558a"], [0.8, "#f08a5a"], [1, "#ffc27a"]]); g.fillRect(0, 0, 1920, 1080);
  E(g, 380, 640, 110, 110, "#ffe0a0", 0); glow(g, 380, 640, 360, "rgba(255,220,150,A)", 0.5);
  for (let i = 0; i < 4; i++) E(g, 300 + i * 450, 160 + (i % 2) * 70, 140, 30, "rgba(255,200,190,0.35)", 0);
  g.fillStyle = "#5a3a6a"; g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1920; x += 60) g.lineTo(x, 690 - 30 * Math.abs(Math.sin(x * 0.011 + 1))); g.lineTo(1920, 760); g.lineTo(0, 760); g.fill();
  palm(g, 120, 760, 420, "#3a3a5a", 4); palm(g, 1000, 770, 470, "#3a3a5a", 4);
  house(g, 230, 560, 770, "#e9c79a", "#a8443c", 1);
  house(g, 1240, 600, 770, "#bfe0d6", "#3f6f8a", 2, true);
  R(g, -10, 770, 1940, 70, "#9a8e84", 6); for (let x = 0; x < 1920; x += 160) L(g, [[x, 770], [x - 20, 840]], 3, "rgba(53,31,34,0.4)");
  R(g, -10, 840, 1940, 240, vgrad(g, 840, 1080, [[0, "#4a4458"], [1, "#2e2a3a"]]), 6);
  for (let x = 40; x < 1920; x += 260) R(g, x, 960, 140, 14, "#e9d48a", 0);
  R(g, 1130, 380, 16, 400, "#3a3a44", 5); R(g, 1100, 360, 76, 30, "#3a3a44", 5, 6); glow(g, 1138, 400, 160, "rgba(255,225,150,A)", 0.5); E(g, 1138, 392, 14, 8, "#fff1c2", 3);
  R(g, 1100, 700, 60, 44, "#3f6f8a", 5, 8); R(g, 1124, 744, 12, 30, "#5e3a24", 4);
} };

// ---- 6. crypto-chart world: plum void with a faint grid, ghost candlesticks, a glossy floor ----
const crypto: SetDef = { vig: 0.55, key: [960, 200], bg: (g) => {
  g.fillStyle = vgrad(g, 0, 1080, [[0, "#2a1a36"], [0.7, "#4a2a52"], [1, "#2a1a30"]]); g.fillRect(0, 0, 1920, 1080);
  for (let x = 0; x <= 1920; x += 96) L(g, [[x, 0], [x, 860]], 1.5, "rgba(255,210,31,0.08)");
  for (let y = 40; y <= 860; y += 96) L(g, [[0, y], [1920, y]], 1.5, "rgba(255,210,31,0.08)");
  for (let i = 0; i < 26; i++) { const x = 40 + i * 72, h = 40 + rnd(9, i) * 140, y = 760 - i * 18 - rnd(3, i) * 80, up = rnd(4, i) > 0.35;
    L(g, [[x + 14, y - 30], [x + 14, y + h + 30]], 3, "rgba(255,255,255,0.10)"); R(g, x, y, 28, h, up ? "rgba(90,200,120,0.16)" : "rgba(230,80,80,0.16)", 0, 3); }
  g.fillStyle = vgrad(g, 860, 1080, [[0, "#3a2244"], [1, "#1e1226"]]); g.fillRect(0, 860, 1920, 220); L(g, [[0, 860], [1920, 860]], 5, "#ffd21f");
  glow(g, 960, 860, 700, "rgba(255,210,31,A)", 0.12);
} };

// ---- 7. Hall of Fame stage: curtains, banner, stars, podium, spotlight, audience heads in front ----
const hall: SetDef = { vig: 0.55, key: [960, 100], bg: (g) => {
  g.fillStyle = vgrad(g, 0, 860, [[0, "#3a1e2a"], [1, "#5a2a34"]]); g.fillRect(0, 0, 1920, 1080);
  for (let i = 0; i < 9; i++) { const x = 200 + i * 190; Pl(g, [[x, 300], [x + 14, 270], [x + 30, 300], [x + 62, 304], [x + 38, 324], [x + 46, 356], [x + 14, 338], [x - 18, 356], [x - 10, 324], [x - 34, 304]], "rgba(255,201,58,0.25)", 0); }
  R(g, 560, 70, 800, 150, "#c8363a", 8, 14); R(g, 580, 90, 760, 110, "#a82a2e", 3, 10);
  text(g, "HALL OF FAME", 960, 148, 84, "#ffd21f", INK, "center", 0.12);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) E(g, 960 + s * (440 + i * 26), 150 - Math.abs(i - 2) * 14 + i * 10, 18, 9, "#ffc93a", 3);
  const sp = g.createLinearGradient(0, 0, 0, 900); sp.addColorStop(0, "rgba(255,240,200,0.0)"); sp.addColorStop(1, "rgba(255,240,200,0.22)");
  g.fillStyle = sp; g.beginPath(); g.moveTo(880, 0); g.lineTo(1040, 0); g.lineTo(1260, 880); g.lineTo(660, 880); g.fill();
  g.fillStyle = vgrad(g, 860, 1080, [[0, "#7a4b2a"], [1, "#4a2a1a"]]); g.fillRect(0, 860, 1920, 220); L(g, [[0, 860], [1920, 860]], 7);
  E(g, 960, 880, 300, 30, "rgba(255,240,200,0.25)", 0);
  for (const s of [-1, 1]) { g.fillStyle = vgrad(g, 0, 1080, [[0, "#b8282e"], [1, "#7a1a20"]]); g.beginPath(); const x0 = s < 0 ? 0 : 1920; g.moveTo(x0, 0); g.lineTo(x0 + s * -300, 0); g.quadraticCurveTo(x0 + s * -200, 500, x0 + s * -330, 1080); g.lineTo(x0, 1080); g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    for (let k = 1; k < 4; k++) L(g, [[x0 + s * -70 * k, 0], [x0 + s * -(60 * k + 20), 1080]], 3, "rgba(40,10,10,0.35)"); }
}, fg: (g) => {
  for (let i = 0; i < 12; i++) { const x = 60 + i * 165 + (i % 2) * 30, y = 1060 + (i % 3) * 12; E(g, x, y, 78, 70, ["#3a2430", "#2e1e28", "#43293a"][i % 3], 5); }
} };

// ---- 8. Bitcoin Pizza Day party: evening plaza, string lights, bunting, tables with pizza ----
const party: SetDef = { vig: 0.45, key: [960, 150], bg: (g) => {
  g.fillStyle = vgrad(g, 0, 800, [[0, "#2e2a62"], [0.6, "#7a4a8a"], [1, "#e0806a"]]); g.fillRect(0, 0, 1920, 1080);
  for (let i = 0; i < 7; i++) { const x = i * 290 - 40, w = 220, h = 260 + rnd(7, i) * 200; R(g, x, 780 - h, w, h, ["#5a3a6a", "#4a3260", "#63407a"][i % 3], 5); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) if (rnd(i, r * 3 + c) > 0.35) R(g, x + 30 + c * 62, 800 - h + 30 + r * 60, 34, 34, "#ffd77a", 3); }
  for (const [y0, sag] of [[120, 80], [230, 60]] as [number, number][]) {
    const pts: P2[] = []; for (let x = -20; x <= 1940; x += 20) pts.push([x, y0 + sag * Math.sin((x / 1920) * Math.PI)]); L(g, pts, 4);
    pts.forEach(([x, y], i) => { if (i % 4 === 0) { const c = ["#ffd21f", "#e2603c", "#3f9a55", "#4f86b8"][(i / 4) % 4]; if (y0 === 120) { glow(g, x, y + 14, 40, "rgba(255,220,140,A)", 0.5); E(g, x, y + 14, 9, 12, "#fff1c2", 3); } else Pl(g, [[x - 18, y], [x + 18, y], [x, y + 40]], c, 4); } });
  }
  g.fillStyle = vgrad(g, 780, 1080, [[0, "#b98a6a"], [1, "#7a5a4a"]]); g.fillRect(0, 780, 1920, 300); L(g, [[0, 780], [1920, 780]], 6);
  R(g, 560, 900, 800, 40, "#f2ead8", 6, 6); R(g, 600, 940, 20, 140, "#7a4b2a", 4); R(g, 1300, 940, 20, 140, "#7a4b2a", 4);
  const p = new Pen(g); p.ol = 5; pizzaTop(p, 760, 890, 70); pizzaTop(p, 1160, 890, 70);
} };

// ---- 9. forum world: a giant 2010 forum page floating over a warm backdrop ----
const forum: SetDef = { vig: 0.4, key: [960, 150], bg: (g) => {
  g.fillStyle = vgrad(g, 0, 1080, [[0, "#f3d9a8"], [1, "#e2a96c"]]); g.fillRect(0, 0, 1920, 1080);
  for (let y = 60; y < 1080; y += 70) for (let x = (y / 70) % 2 ? 35 : 0; x < 1920; x += 70) E(g, x, y, 4, 4, "rgba(160,90,40,0.12)", 0);
  R(g, 300, 90, 1320, 620, "#f7f3ea", 8, 18); R(g, 300, 90, 1320, 70, "#5a6a8a", 8, 18); R(g, 300, 140, 1320, 20, "#5a6a8a", 0);
  for (let i = 0; i < 3; i++) E(g, 340 + i * 36, 125, 11, 11, ["#e2603c", "#ffd21f", "#3f9a55"][i], 3);
  text(g, "FORUM", 960, 126, 40, "#ffffff", INK, "center", 0.14);
  for (let i = 0; i < 6; i++) { const y = 190 + i * 84; R(g, 340, y, 1240, 70, i % 2 ? "#eef0f4" : "#e2e6ee", 3, 6); E(g, 384, y + 35, 22, 22, ["#f5c9a0", "#d9a67c", "#efc39b"][i % 3], 3);
    R(g, 430, y + 18, 300 + rnd(2, i) * 300, 12, "#9aa4b8", 0, 6); R(g, 430, y + 40, 200 + rnd(8, i) * 500, 10, "#c0c8d6", 0, 5); }
  g.fillStyle = vgrad(g, 860, 1080, [[0, "#c98a5a"], [1, "#a0673e"]]); g.fillRect(0, 860, 1920, 220); L(g, [[0, 860], [1920, 860]], 6);
} };

// ---- 10. explainer studio: clean warm backdrop with a soft dot pattern and a floor line ----
const studio: SetDef = { vig: 0.38, key: [960, 120], bg: (g) => {
  g.fillStyle = vgrad(g, 0, 1080, [[0, "#f6e4bc"], [1, "#eec08a"]]); g.fillRect(0, 0, 1920, 1080);
  for (let y = 50; y < 880; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 1920; x += 64) E(g, x, y, 3.5, 3.5, "rgba(160,90,40,0.10)", 0);
  g.fillStyle = vgrad(g, 880, 1080, [[0, "#d9965e"], [1, "#b8743e"]]); g.fillRect(0, 880, 1920, 200); L(g, [[0, 880], [1920, 880]], 6);
} };

// ---- 11. Laszlo's bedroom at night ----
const bedroom: SetDef = { vig: 0.6, key: [1500, 200], tint: "rgba(30,30,90,0.10)", bg: (g) => {
  g.fillStyle = vgrad(g, 0, 900, [[0, "#2e3a6a"], [1, "#3e4a7a"]]); g.fillRect(0, 0, 1920, 1080);
  windowFrame(g, 1380, 160, 330, 300, vgrad(g, 160, 460, [[0, "#0e1838"], [1, "#24346a"]]), (q) => { E(q, 1620, 230, 34, 34, "#fff1c2", 0); for (let i = 0; i < 14; i++) E(q, 1390 + rnd(15, i) * 310, 170 + rnd(16, i) * 260, 2.5, 2.5, "#fff6c8", 0); });
  const mg = g.createLinearGradient(1400, 460, 1000, 1000); mg.addColorStop(0, "rgba(200,220,255,0.18)"); mg.addColorStop(1, "rgba(200,220,255,0)"); g.fillStyle = mg; g.beginPath(); g.moveTo(1380, 460); g.lineTo(1710, 460); g.lineTo(1300, 1080); g.lineTo(800, 1080); g.fill();
  g.fillStyle = "#26305a"; g.fillRect(0, 820, 1920, 260); L(g, [[0, 820], [1920, 820]], 6);
  R(g, 240, 520, 60, 320, "#5e3a24", 6, 6); // headboard post
  R(g, 240, 640, 1100, 200, "#5e3a24", 6, 10);
  E(g, 400, 660, 120, 46, "#f2ead8", 6);
  R(g, 1180, 690, 150, 150, "#4a3a2a", 6, 6); E(g, 1255, 650, 46, 20, "#e8d6a0", 5); R(g, 1245, 600, 20, 50, "#a08a6a", 4);
}, fg: (g) => {
  R(g, 540, 600, 680, 180, "#4f86b8", 7, 30); for (let i = 1; i < 4; i++) L(g, [[540 + i * 170, 610], [560 + i * 170, 770]], 3, "rgba(30,40,80,0.3)");
  R(g, 280, 760, 940, 70, "#3f6f9a", 7, 10);
} };

// ---- 12. Paris at dusk with the Eiffel Tower (teaser) ----
const paris: SetDef = { vig: 0.5, key: [960, 600], bg: (g) => {
  g.fillStyle = vgrad(g, 0, 900, [[0, "#2e2a62"], [0.55, "#a0558a"], [1, "#f6a35c"]]); g.fillRect(0, 0, 1920, 1080);
  const tw = (y: number) => 30 + (900 - y) * 0 + Math.pow((900 - y) / 760, 0.0) * 0; void tw;
  const cx = 1200, top = 90, base = 880, half = (y: number) => 18 + 300 * Math.pow((y - top) / (base - top), 2.2);
  const ptsL: P2[] = [], ptsR: P2[] = []; for (let y = top; y <= base; y += 20) { ptsL.push([cx - half(y), y]); ptsR.unshift([cx + half(y), y]); }
  Pl(g, [...ptsL, [cx - 150, base], [cx - 100, 760], [cx, 720], [cx + 100, 760], [cx + 150, base], ...ptsR], "#3a2a40", 7);
  for (const y of [380, 600]) R(g, cx - half(y) - 20, y - 12, 2 * half(y) + 40, 24, "#4a3450", 6);
  for (let y = top + 40; y < base - 20; y += 44) L(g, [[cx - half(y) + 6, y], [cx + half(y + 44) - 6, y + 44]], 2, "rgba(255,200,150,0.25)");
  R(g, cx - 6, top - 60, 12, 60, "#3a2a40", 4);
  for (let i = 0; i < 12; i++) { const x = i * 170 - 30, h = 120 + rnd(21, i) * 120; Pl(g, [[x, 900], [x, 900 - h], [x + 80, 900 - h - 50], [x + 160, 900 - h], [x + 160, 900]], ["#4a3260", "#553a6a"][i % 2], 5); }
  g.fillStyle = "#3a2a48"; g.fillRect(0, 900, 1920, 180); L(g, [[0, 900], [1920, 900]], 6);
} };

export const SETS: Record<string, SetDef> = { host, office, room, shop, street, crypto, hall, party, forum, studio, bedroom, paris };
export type SetName = keyof typeof SETS;

const CACHE_SCALE = 1.5;
const cache = new Map<string, HTMLCanvasElement>();
const cached = (key: string, fn: (g: G) => void) => {
  let c = cache.get(key);
  if (!c) {
    if (cache.size > 6) { const k0 = cache.keys().next().value as string; cache.delete(k0); }
    c = document.createElement("canvas"); c.width = 1920 * CACHE_SCALE; c.height = 1080 * CACHE_SCALE;
    const g = c.getContext("2d")!; g.scale(CACHE_SCALE, CACHE_SCALE); fn(g); cache.set(key, c);
  }
  return c;
};
export const drawSetBg = (g: G, name: string) => g.drawImage(cached(name + ":bg", SETS[name].bg), 0, 0, 1920, 1080);
export const drawSetFg = (g: G, name: string) => { const f = SETS[name].fg; if (f) g.drawImage(cached(name + ":fg", f), 0, 0, 1920, 1080); };
/** screen-space light: soft warm key from the set's key position + vignette (constant per set) */
export const drawLight = (g: G, name: string) => {
  const s = SETS[name];
  const k = g.createRadialGradient(s.key[0], s.key[1], 0, s.key[0], s.key[1], 1300); k.addColorStop(0, "rgba(255,236,190,0.16)"); k.addColorStop(1, "rgba(255,236,190,0)");
  g.fillStyle = k; g.fillRect(0, 0, 1920, 1080);
  if (s.tint) { g.fillStyle = s.tint; g.fillRect(0, 0, 1920, 1080); }
  const v = g.createRadialGradient(960, 520, 520, 960, 540, 1180); v.addColorStop(0, "rgba(30,12,24,0)"); v.addColorStop(1, `rgba(30,12,24,${s.vig})`);
  g.fillStyle = v; g.fillRect(0, 0, 1920, 1080);
};
export { R, Pl, E, L, vgrad, glow, crt, coinGlyph };
