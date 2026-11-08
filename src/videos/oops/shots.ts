// Oopsonomics ep01 shot list. All key times are ABSOLUTE seconds on the voice-over (transcript.json word times).
import { Pen } from "../molasses/toon";
import { BUCK, LASZLO, JEREMY, DRIVER, extra, drawChar, act, CharState, CharDef, clamp, ease, easeOut, lerp, pizzaTop, laptop } from "./cast";
import { OFFICE_CRT, CRT_SCREEN, R, E, L, text, glow } from "./sets";
import * as P from "./props";

type G = CanvasRenderingContext2D;
export type Ctx = { g: G; t: number; lt: number; dur: number; talk: number; shot: Shot };
export type Shot = { t0: number; set: string; cam: number[]; d?: (C: Ctx) => void; o?: (C: Ctx) => void; tr?: "cut" | "pan" | "fade"; dir?: number };

const K = (keys: [number, CharState][]) => keys;
const ch = (C: Ctx, c: CharDef, x: number, y: number, s: number, keys: [number, CharState][], extraSt: CharState = {}, flip = false) =>
  drawChar(C.g, c, x, y, s, { ...act(C.t, keys), ...extraSt }, C.t, flip);
/** Buck talks with the voice (small, simple mouth) */
const buck = (C: Ctx, x: number, y: number, s: number, keys: [number, CharState][], extraSt: CharState = {}) => ch(C, BUCK, x, y, s, keys, { talk: C.talk, ...extraSt });
const quoteTalk = (C: Ctx, a: number, b: number) => (C.t > a && C.t < b ? C.talk : 0);
const walk = (C: Ctx, c: CharDef, x0: number, y: number, s: number, t0: number, dir = 1, expr: any = "flat") => {
  const lt = C.t - t0, sp = 2 * 370 * 0.7 * s; // one stride cycle per second, matched to step length (no foot slide)
  drawChar(C.g, c, x0 + dir * sp * lt, y, s, { mode: "stroll", phase: lt, expr }, C.t, dir < 0);
};
const crtScreen = (C: Ctx, fn: (x: number, y: number, w: number, h: number) => void) => {
  const s = CRT_SCREEN(OFFICE_CRT.x, OFFICE_CRT.y - 60, OFFICE_CRT.w), g = C.g;
  g.save(); g.beginPath(); g.roundRect(s.x, s.y, s.w, s.h, 14); g.clip();
  g.fillStyle = "#14324a"; g.fillRect(s.x, s.y, s.w, s.h); fn(s.x, s.y, s.w, s.h);
  g.fillStyle = "rgba(255,255,255,0.05)"; for (let y = s.y; y < s.y + s.h; y += 6) g.fillRect(s.x, y, s.w, 2);
  const gl = g.createRadialGradient(s.x + s.w * 0.3, s.y + s.h * 0.25, 0, s.x + s.w * 0.3, s.y + s.h * 0.25, s.w * 0.6); gl.addColorStop(0, "rgba(255,255,255,0.10)"); gl.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gl; g.fillRect(s.x, s.y, s.w, s.h);
  g.restore();
};
/** forum page on the CRT: header, a post with abstract lines; optional typed lines and badge */
const forumPage = (C: Ctx, x: number, y: number, w: number, h: number, typed = 1, badge?: string) => {
  const g = C.g; g.fillStyle = "#e9edf3"; g.fillRect(x, y, w, h); g.fillStyle = "#5a6a8a"; g.fillRect(x, y, w, 34);
  text(g, "FORUM", x + 14, y + 18, 18, "#ffffff", "", "left");
  R(g, x + 12, y + 46, w - 24, h - 60, "#ffffff", 2, 6); E(g, x + 40, y + 76, 16, 16, "#f7d2b4", 2);
  for (let i = 0; i < 6; i++) { const k = clamp(typed * 6 - i); if (k > 0) R(g, x + 66, y + 66 + i * 26, (w - 110) * (0.55 + 0.4 * ((i * 37) % 10) / 10) * k, 10, i === 0 ? "#5a6a8a" : "#b9c2d2", 0, 5); }
  if (badge) P.tag(g, badge, x + w / 2, y + h - 40, 24, C.t, C.shot.t0 + 0.6, 1e9, true);
};
const typingLaszlo = (C: Ctx, expr: any = "flat", t0 = 0, extraSt: CharState = {}) => ch(C, LASZLO, 760, 847, 0.72, K([[t0, { expr, L: "desk", R: "desk", facing: 1, look: 0.6 }]]), extraSt);
// typing shimmer: hands bob a little (alternating), drawn by nudging look/tilt
const typeBob = (t: number) => ({ tilt: 0.6 * Math.sin(t * 13), headTilt: 0.8 * Math.sin(t * 2.1) });

export const SHOTS: Shot[] = [
  // ================= 01 COLD OPEN =================
  { t0: 0, set: "party", cam: [960, 560, 1.06, 960, 540, 1.16], tr: "fade", d: (C) => {
    const xs = [380, 640, 1280, 1540, 900, 1040];
    xs.forEach((x, i) => ch(C, extra(i), x, i > 3 ? 905 : 960, i > 3 ? 0.5 : 0.58, K([[0, { expr: i % 2 ? "content" : "smile", L: "down", R: i % 3 ? "coin" : "down", prop: i % 3 ? "slice" : null, facing: x < 960 ? 1 : -1 }]])));
  } },
  { t0: 2.68, set: "party", cam: [960, 760, 1.5, 960, 790, 1.72], tr: "cut", d: (C) => {
    [430, 1490].forEach((x, i) => ch(C, extra(i + 2), x, 1040, 0.5, K([[0, { expr: "smile", R: "point", facing: i ? -1 : 1, look: i ? -0.6 : 0.6 }], [5.6, { expr: "content" }]]), {}, i === 1));
  } },
  { t0: 6.3, set: "host", cam: [1150, 470, 1.62, 1150, 450, 1.74], tr: "cut", d: (C) => buck(C, 1150, 985, 0.95, K([[0, { expr: "flat" }], [7.5, { headTilt: -4 }], [8.6, { headTilt: 0 }]])) },
  { t0: 9.1, set: "street", cam: [700, 600, 1.4, 1420, 640, 1.7], tr: "pan", dir: 1, d: (C) => {
    ch(C, DRIVER, 1470, 820, 0.25, K([[0, { expr: "smile", L: "hold", R: "hold", prop: "boxes", propN: 2, facing: 1, look: 0.7 }]]));
  } },
  { t0: 15.4, set: "host", cam: [1060, 500, 1.3, 1130, 470, 1.5], tr: "pan", dir: -1, d: (C) => buck(C, 1300, 985, 0.95, K([[0, { expr: "flat" }], [17.6, { R: "present", facing: -1 }], [19.3, { R: "down", facing: 0 }], [20.4, { expr: "wide", headTilt: 3 }], [21.9, { expr: "flat", headTilt: 0 }]])) },
  { t0: 22.6, set: "office", cam: [800, 560, 1.25, 720, 600, 1.45], tr: "pan", dir: 1, d: (C) => typingLaszlo(C, "content", 0, typeBob(C.t)),
    o: (C) => { const n = 1 + Math.floor(clamp((C.t - 25.6) / 0.85, 0, 4)); P.boxStack(C.g, 470, 700, 190, n, clamp(((C.t - 25.6) % 0.85) / 0.25 + (C.t > 29 ? 1 : 0))); crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)); } },
  { t0: 28.94, set: "host", cam: [1150, 520, 1.2, 1150, 470, 1.55], tr: "pan", dir: -1, d: (C) => buck(C, 1150, 985, 0.95, K([[0, { expr: "flat" }], [31.5, { R: "present", headTilt: -2 }], [34.0, { R: "down", headTilt: 0 }]])) },
  { t0: 35.1, set: "crypto", cam: [960, 560, 1.08, 960, 520, 1.22], tr: "fade", d: (C) => {
    const g = C.g, p = new Pen(g); p.ol = 7;
    for (let i = 0; i < 9; i++) { const a = i * 0.7, x = 200 + i * 190, y = 300 + 120 * Math.sin(i * 1.7) + 14 * Math.sin(C.t * 0.9 + a); P.coinGlyph(g, x, y, 28 + (i % 3) * 8); }
    g.save(); g.translate(960, 640); g.rotate(C.t * 0.15); pizzaTop(p, 0, 0, 170); g.restore();
  } },
  // ================= 02 A STRANGE NEW MONEY =================
  { t0: 40.8, set: "studio", cam: [960, 600, 1.12, 960, 560, 1.28], tr: "pan", dir: 1, d: (C) => {
    const g = C.g; P.pedestal(g, 960, 900, 150); P.coinGlyph(g, 960, 700, 70); P.candle(g, 1000, 640, 90, C.t);
    walk(C, extra(5), -150, 980, 0.42, 43.0, 1, "flat"); walk(C, extra(6), 2100, 985, 0.44, 45.2, -1, "flat");
  } },
  { t0: 47.96, set: "host", cam: [1150, 500, 1.5, 1150, 470, 1.65], tr: "pan", dir: -1, d: (C) => {
    buck(C, 1150, 985, 0.95, K([[0, { expr: "flat", R: "coin", prop: "coin" }], [52.3, { headTilt: -3 }], [53.2, { headTilt: 0 }]]));
    P.at(C.g, 1450, 600, P.pop(C.t, 50.5) * (1 - P.pop(C.t, 52.45, 0.2)), () => P.gamepad(C.g, 1450, 600, 150));
  } },
  { t0: 53.76, set: "forum", cam: [960, 640, 1.12, 960, 600, 1.3], tr: "pan", dir: 1, d: (C) => {
    for (let i = 0; i < 12; i++) ch(C, extra(i + 10), 300 + i * 120, 990, 0.3, K([[0, { expr: i % 3 ? "flat" : "smile", facing: i < 6 ? 1 : -1, look: 0.3 * Math.sin(i) }]]));
    P.tag(C.g, "A FEW HUNDRED PEOPLE", 960, 760, 44, C.t, 58.4, 1e9, true);
    P.tag(C.g, "PROGRAMMERS", 480, 600, 30, C.t, 59.2); P.tag(C.g, "CRYPTOGRAPHY FANS", 960, 600, 30, C.t, 60.1); P.tag(C.g, "DREAMERS", 1440, 600, 30, C.t, 62.2);
  } },
  { t0: 63.8, set: "office", cam: [900, 560, 1.2, 820, 590, 1.42], tr: "pan", dir: 1, d: (C) => typingLaszlo(C, "flat", 0, typeBob(C.t)),
    o: (C) => crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)) },
  { t0: 71.1, set: "studio", cam: [960, 560, 1.15, 960, 540, 1.32], tr: "pan", dir: 1, d: (C) => {
    const g = C.g; P.tower(g, 760, 900, 420, C.t, 0); P.chip(g, 1160, 560, 200, "CPU", C.t);
    ["+", "×", "÷", "?", "="].forEach((s, i) => text(g, s, 1000 + i * 90, 300 + 30 * Math.sin(C.t * 1.3 + i), 64, "#ffffff", "#351f22"));
    P.tag(g, "CPU", 1160, 770, 40, C.t, 78.4, 1e9, true);
    if (C.t > 75.0) P.coinGlyph(g, 760, 440 - 40 * easeOut((C.t - 75) / 1.2), 40 * P.pop(C.t, 75));
  } },
  { t0: 79.96, set: "studio", cam: [960, 520, 1.12, 960, 500, 1.26], tr: "cut", d: (C) => {
    const g = C.g; P.chip(g, 560, 460, 180, "CPU"); P.gpu(g, 1360, 460, 380, C.t);
    P.tag(g, "CPU", 560, 640, 34, C.t, 80.0); P.tag(g, "GRAPHICS CARD", 1360, 640, 34, C.t, 81.3, 1e9, true);
    for (let i = 0; i < 3; i++) { const k = ((C.t - 80 + i * 0.9) % 2.7) / 2.7; P.coinGlyph(g, 560, 720 + k * 180, 22); }
    for (let i = 0; i < 12; i++) { const k = ((C.t - 82 + i * 0.25) % 3) / 3; if (C.t > 82) P.coinGlyph(g, 1250 + (i % 4) * 70, 720 + k * 180, 22); }
    if (C.t > 87.96) P.tag(g, "FIRST!", 1360, 270, 46, C.t, 88.0, 1e9, true, "#c8363a");
  } },
  { t0: 90.28, set: "studio", cam: [960, 540, 1.1, 1000, 520, 1.25], tr: "pan", dir: 1, d: (C) => {
    const g = C.g; P.drum(g, 700, 470, 210, C.t); P.clockIcon(g, 1300, 420, 120, C.t);
    P.tag(g, "EVERY 10 MINUTES", 1300, 600, 36, C.t, 93.4, 1e9, true);
    if (C.t > 95.6) for (let i = 0; i < 6; i++) { const x = 360 + i * 240; P.monitor(g, x, 860, 170, 120, (sx, sy, sw, sh) => { const won = C.t > 99.6 && i === 3; text(g, won ? "WIN!" : String(1000 + Math.floor((Math.floor(C.t * 5) * 7919 + i * 104729) % 9000)), sx + sw / 2, sy + sh / 2, 34, won ? "#FFD21F" : "#9fe0ff", "", "center"); }); }
  } },
  { t0: 99.0, set: "studio", cam: [960, 700, 1.2, 1080, 720, 1.36], tr: "cut", d: (C) => {
    const g = C.g; for (let i = 0; i < 6; i++) { const x = 360 + i * 240; P.monitor(g, x, 760, 170, 120, (sx, sy, sw, sh) => { const won = C.t > 99.6 && i === 3; text(g, won ? "WIN!" : String(1000 + Math.floor((Math.floor(C.t * 5) * 7919 + i * 104729) % 9000)), sx + sw / 2, sy + sh / 2, 34, won ? "#FFD21F" : "#9fe0ff", "", "center"); }); }
    if (C.t > 99.8) { for (let i = 0; i < 6; i++) { const k = clamp((C.t - 99.8 - i * 0.15) / 0.7); P.coinGlyph(g, lerp(1080, 1080 + (i - 2.5) * 50, k), lerp(380, 620, easeOut(k)), 26); } P.tag(g, "NEW BITCOINS", 1080, 330, 34, C.t, 100.5, 1e9, true); }
    P.tag(g, "MORE GUESSES PER SECOND = BETTER CHANCES", 960, 950, 34, C.t, 102.6);
  } },
  { t0: 106.7, set: "studio", cam: [960, 560, 1.08, 960, 540, 1.18], tr: "pan", dir: 1, d: (C) => {
    ch(C, extra(7), 520, 960, 0.6, K([[0, { expr: "flat", R: "chin" }]]));
    P.bubble(C.g, 690, 300, 110, 90, P.pop(C.t, 107.5), () => text(C.g, "?", 690, 302, 60, "#351f22", ""), 600, 420);
    P.tag(C.g, "NORMAL PROCESSOR", 430, 250, 32, C.t, 107.0);
    if (C.t > 110.3) for (let i = 0; i < 24; i++) { const r = Math.floor(i / 6), cI = i % 6; ch(C, extra(i + 20), 1150 + cI * 105 + (r % 2) * 50, 680 + r * 95, 0.2, K([[0, { expr: "flat", R: i % 2 ? "pointUp" : "down" }]]), { breathe: 2 }); }
    P.tag(C.g, "GRAPHICS CARD", 1440, 560, 32, C.t, 110.6, 1e9, true);
  } },
  { t0: 115.4, set: "office", cam: [1250, 520, 1.5, 1150, 540, 1.7], tr: "pan", dir: 1, d: (C) => typingLaszlo(C, "content", 0, typeBob(C.t)),
    o: (C) => { crtScreen(C, (x, y, w, h) => { const g = C.g; for (let i = 0; i < 9; i++) R(g, x + 20 + (i % 3) * 20, y + 20 + i * 28, (w - 80) * clamp((C.t - 115.6) * 2 - i * 0.6) * (0.4 + 0.5 * ((i * 41) % 10) / 10), 10, i % 3 ? "#5dff8a" : "#9fe0ff", 0, 4); });
      for (let i = 0; i < 3; i++) P.arrow(C.g, 1560, 420 + i * 70, 1790, 340 + i * 110, P.pop(C.t, 117.6 + i * 0.3, 0.5), 10); } },
  { t0: 120.7, set: "office", cam: [820, 600, 1.2, 760, 560, 1.36], tr: "cut", d: (C) => typingLaszlo(C, "content", 0, { L: "deskOut", R: "deskOut" } as any),
    o: (C) => { const n = Math.floor(clamp((C.t - 121.0) * 9, 0, 40)); P.coinPile(C.g, 520, 705, 260, n, 3); P.coinPile(C.g, 1040, 705, 160, Math.floor(n * 0.5), 5); crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)); } },
  { t0: 129.9, set: "host", cam: [1150, 480, 1.55, 1150, 460, 1.7], tr: "pan", dir: -1, d: (C) => buck(C, 1150, 985, 0.95, K([[0, { expr: "flat", R: "coin", prop: "coin" }], [131.7, { expr: "worried", L: "shrug", headTilt: -3 }]])) },
  // ================= 03 THE PROBLEM =================
  { t0: 133.7, set: "host", cam: [1060, 500, 1.3, 1100, 470, 1.45], tr: "cut", d: (C) => {
    buck(C, 1250, 985, 0.95, K([[0, { expr: "flat" }], [136.9, { L: "present" }], [140.0, { L: "down" }]]));
    const g = C.g; P.at(g, 760, 420, P.pop(C.t, 137.0) * (1 - P.pop(C.t, 139.6)), () => { P.banknote(g, 760, 420, 240); P.xMark(g, 760, 420, 200, (C.t - 137.6) / 0.35); });
    P.at(g, 760, 420, P.pop(C.t, 138.3) * (1 - P.pop(C.t, 140.2)), () => { P.silverCoin(g, 900, 560, 80); P.xMark(g, 900, 560, 150, (C.t - 138.8) / 0.35); });
  } },
  { t0: 144.0, set: "shop", cam: [960, 520, 1.2, 1000, 500, 1.35], tr: "pan", dir: 1, d: (C) => {
    ch(C, DRIVER, 1250, 1000, 0.75, K([[0, { expr: "flat", L: "hip", R: "down", facing: -1 }], [145.2, { headTilt: 4 }], [146.4, { headTilt: 0 }]]));
    ch(C, LASZLO, 620, 1060, 0.78, K([[0, { expr: "smile", R: "cardOut", prop: "coin", facing: 1 }], [146.0, { expr: "flat" }]]));
  }, o: (C) => { const g = C.g;
    P.at(g, 640, 300, P.pop(C.t, 148.0) * (1 - P.pop(C.t, 151.5)), () => { P.sandwich(g, 640, 300, 200); P.xMark(g, 640, 300, 170, (C.t - 148.6) / 0.3); });
    P.at(g, 960, 300, P.pop(C.t, 149.2) * (1 - P.pop(C.t, 151.5)), () => { P.sock(g, 960, 300, 200); P.xMark(g, 960, 300, 170, (C.t - 149.7) / 0.3); });
    P.at(g, 1280, 300, P.pop(C.t, 150.4) * (1 - P.pop(C.t, 151.5)), () => P.tag(g, "NOTHING", 1280, 300, 46, C.t, 150.4, 1e9, false, "#c8363a"));
  } },
  { t0: 151.9, set: "office", cam: [780, 560, 1.4, 760, 540, 1.55], tr: "pan", dir: -1, d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "flat", L: "desk", R: "desk" }], [153.2, { expr: "worried", look: -0.4 }], [154.6, { expr: "smile", look: 0.5, headTilt: -3 }]])),
    o: (C) => { crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 0)); P.bubble(C.g, 1020, 300, 180, 150, P.pop(C.t, 154.4), () => { const p = new Pen(C.g); p.ol = 4; pizzaTop(p, 1020, 300, 55); }, 880, 430); } },
  // ================= 04 THE POST =================
  { t0: 156.7, set: "office", cam: [1000, 560, 1.3, 1300, 500, 1.75], tr: "cut", d: (C) => typingLaszlo(C, "flat", 0, typeBob(C.t)),
    o: (C) => crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, clamp((C.t - 158.5) / 3))) },
  { t0: 161.3, set: "office", cam: [1360, 500, 1.95, 1360, 510, 2.15], tr: "cut", d: (C) => typingLaszlo(C, "flat", 0, { ...typeBob(C.t), talk: quoteTalk(C, 161.3, 167.6) } as any),
    o: (C) => crtScreen(C, (x, y, w, h) => { forumPage(C, x, y, w, h, 1); const p = new Pen(C.g); p.ol = 3; pizzaTop(p, x + w - 60, y + h - 70, 34); pizzaTop(p, x + w - 130, y + h - 70, 34); }) },
  { t0: 168.0, set: "studio", cam: [960, 520, 1.12, 960, 540, 1.3], tr: "pan", dir: 1, d: (C) => {
    const g = C.g, p = new Pen(g); p.ol = 7; const cx = 960, cy = 520, r = 250;
    p.ell(cx, cy, r, r, "#d98c3a"); p.ell(cx, cy, r * 0.86, r * 0.86, "#f7c64a", 4);
    const tops: [number, string, (x: number, y: number) => void][] = [
      [169.68, "ONIONS", (x, y) => { E(g, x, y, 22, 16, "rgba(255,255,255,0.0)", 0); g.lineWidth = 6; g.strokeStyle = "#f4efe6"; g.beginPath(); g.ellipse(x, y, 20, 14, 0.4, 0, Math.PI * 2); g.stroke(); }],
      [170.52, "PEPPERS", (x, y) => { R(g, x - 16, y - 8, 32, 16, "#4f9a4a", 3, 8); }],
      [171.12, "SAUSAGE", (x, y) => { E(g, x, y, 15, 13, "#8a4a2a", 3); }],
      [171.82, "MUSHROOMS", (x, y) => { E(g, x, y - 4, 18, 11, "#d6c8b0", 3); R(g, x - 6, y - 2, 12, 14, "#efe6d6", 3, 3); }],
      [172.34, "PEPPERONI", (x, y) => { E(g, x, y, 20, 20, "#c63a2f", 3); }],
    ];
    tops.forEach(([tt, name, fn], j) => { if (C.t < tt) return; const k = P.pop(C.t, tt, 0.3);
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + j * 1.3, d = r * (0.2 + 0.55 * ((i * 37 + j * 13) % 10) / 10); g.save(); g.globalAlpha = k; fn(cx + Math.cos(a) * d, cy + Math.sin(a) * d); g.restore(); }
      P.tag(g, name, j % 2 ? 1460 : 460, 320 + Math.floor(j / 2) * 150 + (j % 2) * 70, 34, C.t, tt); });
    P.at(g, 1520, 820, P.pop(C.t, 175.9), () => { P.fish(g, 1520, 820, 220); P.xMark(g, 1520, 820, 200, (C.t - 176.3) / 0.35); });
  } },
  { t0: 178.4, set: "office", cam: [820, 560, 1.2, 860, 540, 1.32], tr: "pan", dir: -1, d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "smile", L: "desk", R: "deskOut" }], [184.6, { R: "desk" }]])),
    o: (C) => { const g = C.g; crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1));
      P.at(g, 760, 260, P.pop(C.t, 180.0), () => { R(g, 470, 190, 640, 140, "#fff7e4", 6, 20); const p = new Pen(g); p.ol = 3; pizzaTop(p, 550, 260, 44); pizzaTop(p, 650, 260, 44); P.arrow(g, 710, 260, 800, 260, 1, 10); P.coinGlyph(g, 850, 260, 32); text(g, "10,000", 980, 262, 40, "#FFD21F", "#351f22"); }); } },
  { t0: 186.4, set: "office", cam: [760, 540, 1.5, 760, 520, 1.62], tr: "cut", d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "flat", L: "desk", R: "desk", facing: 1, look: 0.6 }], [188.0, { facing: 0, look: 0 }], [190.7, { look: 0.6, facing: 1 }]])),
    o: (C) => crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)) },
  { t0: 191.5, set: "forum", cam: [960, 660, 1.2, 960, 640, 1.34], tr: "pan", dir: 1, d: (C) => {
    for (let i = 0; i < 8; i++) ch(C, extra(i + 30), 380 + i * 165, 990, 0.36, K([[0, { expr: i % 2 ? "worried" : "flat", R: i % 3 === 0 ? "chin" : "down", facing: i < 4 ? 1 : -1 }]]));
    P.bubble(C.g, 960, 470, 380, 110, P.pop(C.t, 193.0), () => text(C.g, "10,000 BTC = ?", 960, 472, 46, "#351f22", ""), 900, 640);
  } },
  // ================= 05 THE 19-YEAR-OLD =================
  { t0: 200.4, set: "office", cam: [1250, 520, 1.6, 1330, 500, 1.85], tr: "pan", dir: -1, d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "flat", L: "desk", R: "desk", facing: 1, look: 0.6 }], [202.3, { expr: "o" }]])),
    o: (C) => crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1, C.t > 202.14 ? "1 NEW REPLY" : undefined)) },
  { t0: 203.4, set: "room", cam: [900, 500, 1.3, 960, 480, 1.46], tr: "pan", dir: 1, d: (C) => ch(C, JEREMY, 900, 885, 0.85, K([[0, { expr: "flat", L: "desk", R: "desk", look: 0.2 }], [206.5, { expr: "smile" }]]), typeBob(C.t)),
    o: (C) => laptop(new Pen(C.g), 900, 702, 300, "#c9ccd2") },
  { t0: 210.4, set: "host", cam: [1180, 520, 1.25, 1150, 480, 1.4], tr: "pan", dir: -1, d: (C) => buck(C, 1450, 985, 0.95, K([[0, { expr: "flat", L: "present", facing: -1 }], [214.2, { L: "down", facing: 0 }], [217.4, { headTilt: -3 }]])) },
  { t0: 218.4, set: "host", cam: [1450, 470, 1.7, 1450, 450, 1.82], tr: "cut", d: (C) => buck(C, 1450, 985, 0.95, K([[0, { expr: "flat", L: "shrug", R: "shrug" }], [220.6, { expr: "smile", L: "down", R: "down", headTilt: 3 }]])) },
  { t0: 224.0, set: "studio", cam: [960, 540, 1.06, 960, 540, 1.14], tr: "fade", d: () => {} },
  { t0: 227.5, set: "shop", cam: [960, 500, 1.25, 1150, 500, 1.4], tr: "pan", dir: 1, d: (C) => ch(C, DRIVER, 1160, 1000, 0.75, K([[0, { expr: "flat", L: "hold", R: "hold", prop: "boxes", propN: 1 }], [229.0, { prop: "boxes", propN: 2, expr: "smile" }]])) },
  { t0: 233.0, set: "room", cam: [960, 480, 1.45, 1040, 470, 1.62], tr: "pan", dir: -1, d: (C) => ch(C, JEREMY, 900, 885, 0.85, K([[0, { expr: "flat", L: "desk", R: "cardOut", prop: "card" }]])),
    o: (C) => { laptop(new Pen(C.g), 760, 702, 260, "#c9ccd2"); P.tag(C.g, "LESS THAN $50", 1250, 330, 44, C.t, 234.5, 1e9, true); } },
  { t0: 236.6, set: "street", cam: [1450, 610, 1.85, 1540, 620, 2.05], tr: "pan", dir: 1, d: (C) => {
    ch(C, DRIVER, 1450, 822, 0.25, K([[0, { expr: "smile", L: "hold", R: "hold", prop: "boxes", propN: 2, facing: 1 }], [242.0, { L: "down", R: "down", prop: null }]]));
    ch(C, LASZLO, 1612, 806, 0.25, K([[0, { expr: "smile", facing: -1 }], [242.0, { L: "hold", R: "hold", prop: "boxes", propN: 2, expr: "content" }]]));
  } },
  { t0: 245.2, set: "office", cam: [760, 540, 1.35, 740, 500, 1.6], tr: "pan", dir: -1, d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "content", L: "desk", R: "coin", prop: "slice" }], [254.5, { expr: "smile", look: 0.5, headTilt: -3 }]])),
    o: (C) => { const p = new Pen(C.g); p.ol = 6; R(C.g, 380, 650, 300, 60, "#e7c38d", 6, 4); pizzaTop(p, 530, 660, 110); crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)); } },
  { t0: 255.3, set: "studio", cam: [960, 560, 1.1, 960, 540, 1.26], tr: "pan", dir: 1, d: (C) => {
    ch(C, JEREMY, 480, 960, 0.62, K([[0, { expr: "flat", R: "cardOut", prop: "card", facing: 1 }]]));
    ch(C, LASZLO, 1440, 960, 0.62, K([[0, { expr: "flat", R: "cardOut", prop: "coin", facing: 1 }]]), {}, true);
    P.tag(C.g, "NORMAL DOLLARS", 480, 300, 34, C.t, 258.4); P.tag(C.g, "DIGITAL COINS", 1440, 300, 34, C.t, 262.2, 1e9, true);
    if (C.t > 267.6) P.boxStack(C.g, 960, 780, 260, 2, P.pop(C.t, 267.6, 0.4));
    if (C.t > 267.6) { P.arrow(C.g, 720, 620, 860, 700, clamp((C.t - 267.6) / 0.5), 10); P.arrow(C.g, 1200, 620, 1060, 700, clamp((C.t - 267.6) / 0.5), 10); }
  } },
  { t0: 269.8, set: "studio", cam: [960, 560, 1.4, 960, 540, 1.58], tr: "cut", d: (C) => {
    P.boxStack(C.g, 960, 900, 240, 1);
    ch(C, JEREMY, 830, 975, 0.62, K([[0, { expr: "smile", R: "present", facing: 1 }]]));
    ch(C, LASZLO, 1090, 975, 0.62, K([[0, { expr: "smile", R: "present", facing: 1 }]]), {}, true);
    P.tag(C.g, "OLD MONEY", 700, 330, 30, C.t, 269.9); P.tag(C.g, "NEW MONEY", 1220, 330, 30, C.t, 271.0, 1e9, true);
  } },
  { t0: 274.2, set: "office", cam: [900, 560, 1.3, 980, 540, 1.48], tr: "pan", dir: -1, d: (C) => typingLaszlo(C, "content", 0, { ...typeBob(C.t), talk: quoteTalk(C, 276.4, 280.9) } as any),
    o: (C) => { P.boxStack(C.g, 450, 700, 190, 2); crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, clamp((C.t - 276.4) / 4))); } },
  { t0: 282.1, set: "studio", cam: [960, 580, 1.1, 960, 560, 1.24], tr: "pan", dir: 1, d: (C) => {
    ch(C, LASZLO, 560, 960, 0.6, K([[0, { expr: "content", R: "coin", prop: "slice" }]]));
    ch(C, JEREMY, 1360, 960, 0.6, K([[0, { expr: "flat" }], [285.9, { expr: "content", R: "coin", prop: "coin" }]]));
  } },
  // ================= 06 QUICK PAUSE =================
  { t0: 291.9, set: "host", cam: [1150, 480, 1.5, 1150, 460, 1.66], tr: "pan", dir: -1, d: (C) => {
    buck(C, 1150, 985, 0.95, K([[0, { expr: "flat" }], [296.0, { expr: "smile", R: "thumb" }], [298.6, { R: "down" }]]));
    P.at(C.g, 820, 330, P.pop(C.t, 292.1) * (1 - P.pop(C.t, 295.5)), () => { R(C.g, 760, 280, 40, 110, "#ffffff", 6, 8); R(C.g, 840, 280, 40, 110, "#ffffff", 6, 8); });
  } },
  { t0: 300.7, set: "host", cam: [1300, 520, 1.3, 1350, 500, 1.42], tr: "cut", d: (C) => buck(C, 1500, 985, 0.95, K([[0, { expr: "flat", headTilt: -2 }], [306.2, { R: "point", headTilt: 0 }], [307.3, { R: "down" }]])) },
  { t0: 307.5, set: "host", cam: [1150, 460, 1.6, 1150, 430, 1.95], tr: "cut", d: (C) => buck(C, 1150, 985, 0.95, K([[0, { expr: "flat" }], [310.6, { expr: "worried", headTilt: 2 }]])) },
  // ================= 07 HE KEPT ORDERING =================
  { t0: 312.4, set: "office", cam: [700, 600, 1.15, 640, 540, 1.35], tr: "pan", dir: 1, d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "content", L: "desk", R: "coin", prop: "slice" }]])),
    o: (C) => { const n = 1 + Math.floor(clamp((C.t - 313.0) / 1.0, 0, 9)); P.boxStack(C.g, 440, 700, 190, n, clamp(((C.t - 313) % 1.0) / 0.25 + (C.t > 322.5 ? 1 : 0)));
      crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)); } },
  { t0: 323.3, set: "office", cam: [600, 450, 1.25, 640, 470, 1.4], tr: "cut", d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "content", L: "desk", R: "coin", prop: "slice" }], [328.3, { expr: "flat", headTilt: -2 }]])),
    o: (C) => { P.boxStack(C.g, 440, 700, 190, 10); crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)); } },
  { t0: 331.4, set: "office", cam: [1360, 500, 1.9, 1360, 500, 2.05], tr: "pan", dir: -1, d: (C) => typingLaszlo(C, "flat", 0, typeBob(C.t)),
    o: (C) => crtScreen(C, (x, y, w, h) => { forumPage(C, x, y, w, h, 1); P.tag(C.g, "OFFER CLOSED", x + w / 2, y + h / 2, 34, C.t, 333.1, 1e9, false, "#c8363a"); }) },
  { t0: 334.0, set: "studio", cam: [960, 600, 1.12, 960, 580, 1.26], tr: "pan", dir: 1, d: (C) => {
    const k = clamp((C.t - 334.6) / 3.2); P.coinPile(C.g, 600, 960, 480, Math.round(60 * (1 - k)), 9); P.boxStack(C.g, 1320, 960, 240, Math.round(1 + 11 * k), 1);
  } },
  // ================= 08 THEN THE PRICE WOKE UP (HF ticker on top) =================
  { t0: 338.7, set: "crypto", cam: [960, 600, 1.08, 900, 560, 1.22], tr: "pan", dir: 1, d: (C) => cryptoBuck(C) },
  { t0: 350.1, set: "office", cam: [760, 560, 1.4, 760, 540, 1.52], tr: "cut", d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "content", L: "desk", R: "coin", prop: "slice" }]])),
    o: (C) => { P.candle(C.g, 1040, 700, 110, C.t); const p = new Pen(C.g); p.ol = 6; R(C.g, 380, 650, 300, 60, "#e7c38d", 6, 4); pizzaTop(p, 530, 660, 110); crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)); } },
  { t0: 352.6, set: "crypto", cam: [900, 580, 1.12, 960, 560, 1.24], tr: "cut", d: (C) => cryptoBuck(C) },
  { t0: 361.2, set: "shop", cam: [1080, 420, 1.3, 1080, 400, 1.42], tr: "pan", dir: 1, d: (C) => P.soldSign(C.g, 1530, 330, 160, P.pop(C.t, 361.8)) },
  { t0: 362.6, set: "street", cam: [900, 560, 1.15, 1000, 540, 1.24], tr: "cut", d: (C) => { P.soldSign(C.g, 520, 590, 110, P.pop(C.t, 363.2)); P.soldSign(C.g, 1840, 600, 110, P.pop(C.t, 363.5)); P.soldSign(C.g, 1260, 600, 110, P.pop(C.t, 363.8)); } },
  { t0: 364.4, set: "crypto", cam: [960, 560, 1.1, 1000, 540, 1.24], tr: "pan", dir: -1, d: (C) => cryptoBuck(C) },
  { t0: 385.0, set: "crypto", cam: [420, 640, 1.7, 430, 600, 1.9], tr: "cut", d: (C) => cryptoBuck(C) },
  // ================= 09 COULD ANYONE HOLD ON? =================
  { t0: 392.42, set: "host", cam: [1150, 500, 1.35, 1100, 480, 1.5], tr: "pan", dir: 1, d: (C) => {
    buck(C, 1250, 985, 0.95, K([[0, { expr: "smile" }], [393.8, { expr: "flat" }], [402.8, { headTilt: -3, look: 0 }]]));
    const k = P.pop(C.t, 397.6, 0.4); if (k > 0) { C.g.save(); C.g.globalAlpha = k; P.coinPile(C.g, 760, 900, 420, 40, 4); C.g.restore(); P.tag(C.g, "10,000 BTC", 760, 560, 40, C.t, 398.6, 1e9, true); }
  } },
  { t0: 404.3, set: "crypto", cam: [960, 560, 1.06, 1000, 560, 1.16], tr: "pan", dir: 1, d: (C) => ch(C, BUCK, 1720, 1010, 0.42, K([[0, { expr: "flat", facing: -1, look: -0.5 }], [411.6, { expr: "worried" }], [416, { expr: "flat" }], [418.5, { expr: "worried" }], [425.2, { expr: "wide" }], [428, { expr: "flat" }], [431.4, { expr: "worried" }], [435.4, { expr: "wide" }]]), { talk: C.talk }) },
  { t0: 437.0, set: "host", cam: [1060, 470, 1.5, 1030, 450, 1.62], tr: "pan", dir: -1, d: (C) => {
    buck(C, 1150, 985, 0.95, K([[0, { expr: "flat" }], [440.3, { expr: "worried", facing: -1, look: -0.6 }]]));
    const g = C.g; ["SELL.", "SELL NOW.", "TAKE THE MONEY."].forEach((s, i) => { const bx = 760 - (i % 2) * 30, by = 300 + i * 115; P.bubble(g, bx, by, 90 + s.length * 22, 84, P.pop(C.t, [440.4, 440.9, 441.8][i]), () => text(g, s, bx, by + 2, 36, "#351f22", ""), bx + 120, by + 70, false); });
  } },
  { t0: 443.0, set: "host", cam: [1060, 520, 1.25, 1120, 500, 1.4], tr: "cut", d: (C) => {
    buck(C, 1250, 985, 0.95, K([[0, { expr: "flat", L: "present" }], [447.6, { L: "down" }], [452.6, { expr: "flat", headTilt: 2 }]]));
    const k = 1 - P.pop(C.t, 449.0); if (k > 0) { C.g.save(); C.g.globalAlpha = k; P.coinPile(C.g, 760, 900, 380, 34, 6); C.g.restore(); }
  } },
  { t0: 449.1, set: "studio", cam: [960, 560, 1.1, 960, 540, 1.25], tr: "pan", dir: 1, d: (C) => {
    ch(C, extra(8), 960, 970, 0.6, K([[0, { expr: "flat", R: "coin", prop: "coin" }], [457.2, { expr: "worried", headTilt: 3 }]]));
    const g = C.g;
    P.at(g, 420, 420, P.pop(C.t, 453.6), () => P.houseIcon(g, 420, 420, 230)); P.at(g, 960, 300, P.pop(C.t, 454.4), () => P.carIcon(g, 960, 300, 250)); P.at(g, 1500, 420, P.pop(C.t, 455.4), () => P.islandIcon(g, 1500, 420, 260));
    P.tag(g, "A HOUSE", 420, 600, 30, C.t, 453.6); P.tag(g, "A CAR", 960, 440, 30, C.t, 454.4); P.tag(g, "A WHOLE NEW LIFE", 1500, 600, 30, C.t, 455.4, 1e9, true);
  } },
  { t0: 460.0, set: "host", cam: [1300, 520, 1.25, 1340, 490, 1.38], tr: "pan", dir: -1, d: (C) => buck(C, 1500, 985, 0.95, K([[0, { expr: "flat" }], [465.2, { headTilt: -3 }], [467.2, { headTilt: 0 }], [471.7, { expr: "smile", headTilt: 2 }]])) },
  // ================= 10 DOES HE REGRET IT? =================
  { t0: 473.4, set: "bedroom", cam: [760, 600, 1.3, 700, 620, 1.45], tr: "pan", dir: 1, d: (C) => bedLaszlo(C, C.t < 479.5 ? "flat" : "smile_closed"),
    o: (C) => { if (C.t < 479.5) P.bubble(C.g, 700, 330, 200, 160, P.pop(C.t, 474.8), () => { const p = new Pen(C.g); p.ol = 4; pizzaTop(p, 700, 330, 60); }, 470, 560); else text(C.g, "Z z", 640, 480 - 20 * (C.t - 479.5), 60, "#ffffff", "#351f22"); } },
  { t0: 480.1, set: "studio", cam: [960, 520, 1.2, 960, 500, 1.34], tr: "pan", dir: 1, d: (C) => {
    ch(C, extra(40), 560, 980, 0.56, K([[0, { expr: "flat", R: "present", prop: "mic", facing: 1 }]]));
    ch(C, extra(41), 1380, 980, 0.56, K([[0, { expr: "flat", R: "present", prop: "mic", facing: 1 }]]), {}, true);
    ch(C, LASZLO, 960, 960, 0.64, K([[0, { expr: "smile" }], [483.4, { expr: "content", headTilt: -3 }]]));
  } },
  { t0: 486.2, set: "office", cam: [700, 560, 1.25, 640, 540, 1.4], tr: "pan", dir: -1, d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "smile", L: "desk", R: "desk" }], [496.4, { expr: "content" }]])),
    o: (C) => { const g = C.g; glow(g, 365, 560, 220, "rgba(120,220,255,A)", 0.35);
      P.tag(g, "A HOBBY", 1000, 300, 34, C.t, 489.6); P.tag(g, "FREE PIZZA", 1000, 300, 34, C.t, 487.0, 489.4, true);
      if (C.t > 496.4) P.boxStack(g, 1030, 700, 180, 1, P.pop(C.t, 496.4)); crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)); } },
  { t0: 497.1, set: "studio", cam: [960, 560, 1.1, 980, 540, 1.26], tr: "pan", dir: 1, d: (C) => {
    const g = C.g;
    for (let i = 0; i < 7; i++) { const x = 200 + i * 250, y = 250 + 60 * Math.sin(i * 2.1) + 16 * Math.sin(C.t * 0.8 + i); g.save(); g.translate(x, y); g.rotate(0.2 * Math.sin(i * 3 + C.t * 0.5)); P.banknote(g, 0, 0, 180, ["#f2a0a8", "#9fd0f0", "#f6e08a", "#bfe3a8"][i % 4]); g.restore(); }
    ch(C, extra(42), 640, 980, 0.56, K([[0, { expr: "smile", R: "cardOut", prop: "coin", facing: 1 }]]));
    ch(C, extra(43), 1280, 980, 0.56, K([[0, { expr: "o", facing: -1 }], [505.6, { expr: "smile" }]]));
  } },
  { t0: 507.7, set: "studio", cam: [960, 520, 1.2, 960, 500, 1.34], tr: "cut", d: (C) => {
    const g = C.g; P.monitor(g, 960, 470, 620, 400, (sx, sy, sw, sh) => { g.fillStyle = "#f7f3ea"; g.fillRect(sx, sy, sw, sh); text(g, "FREE BITCOINS", sx + sw / 2, sy + 60, 42, "#FFD21F", "#351f22"); R(g, sx + sw / 2 - 90, sy + 120, 180, 56, "#3f9a55", 4, 14); text(g, "GET", sx + sw / 2, sy + 149, 30, "#ffffff", ""); });
    for (let i = 0; i < 10; i++) { const k = ((C.t - 508 + i * 0.4) % 4) / 4; if (C.t > 508) P.coinGlyph(g, 760 + i * 44, 720 + k * 260, 24); }
  } },
  { t0: 512.0, set: "studio", cam: [960, 560, 1.2, 960, 540, 1.34], tr: "pan", dir: 1, d: (C) => {
    ch(C, extra(44), 700, 980, 0.6, K([[0, { expr: "flat", L: "hold", R: "hold" }], [515.2, { expr: "content" }]]));
    P.newspaper(C.g, 700, 600, 260);
    ch(C, extra(45), 1240, 980, 0.6, K([[0, { expr: "flat", facing: -1 }], [515.6, { expr: "smile_closed" }]]));
  } },
  { t0: 518.0, set: "room", cam: [900, 500, 1.3, 960, 480, 1.46], tr: "pan", dir: -1, d: (C) => ch(C, JEREMY, 900, 885, 0.85, K([[0, { expr: "flat", L: "desk", R: "desk" }], [524.5, { expr: "smile" }]]), typeBob(C.t)),
    o: (C) => { laptop(new Pen(C.g), 900, 702, 300, "#c9ccd2"); if (C.t > 524.5) for (let i = 0; i < 8; i++) { const k = clamp((C.t - 524.5 - i * 0.25) / 1.6); if (k > 0 && k < 1) P.coinGlyph(C.g, 900 + k * (600 + i * 30), 600 - Math.sin(k * Math.PI) * 220 - i * 10, 26); } } },
  // ================= 11 WHY THIS OOPS MATTERED =================
  { t0: 528.4, set: "studio", cam: [960, 540, 1.15, 960, 520, 1.34], tr: "pan", dir: 1, d: (C) => {
    const g = C.g; P.spot(g, 960, 900, 600, 0.3); P.pedestal(g, 960, 900, 200); const p = new Pen(g); p.ol = 7; pizzaTop(p, 960, 650, 150);
    P.tag(g, "THE MOST EXPENSIVE MEAL EVER EATEN?", 960, 260, 38, C.t, 530.0, 534.0, true);
    P.tag(g, "ONE OF THE MOST IMPORTANT", 960, 260, 38, C.t, 534.2, 1e9, false);
  } },
  { t0: 537.0, set: "studio", cam: [960, 580, 1.1, 960, 560, 1.22], tr: "pan", dir: 1, d: (C) => {
    const xs = [460, 960, 1460]; xs.forEach((x, i) => ch(C, extra(50 + i), x, 970, 0.55, K([[0, { expr: "smile", R: "cardOut", facing: i === 2 ? -1 : 1 }]]), {}, i === 2));
    for (let i = 0; i < 3; i++) { const k = ((C.t - 537 + i * 0.9) % 2.7) / 2.7, a = xs[i % 3], b = xs[(i + 1) % 3]; P.coinGlyph(C.g, lerp(a, b, ease(k)), 560 - Math.sin(k * Math.PI) * 160, 28); }
  } },
  { t0: 539.9, set: "studio", cam: [960, 520, 1.25, 960, 500, 1.4], tr: "cut", d: (C) => { const g = C.g; P.monitor(g, 960, 480, 560, 360, (sx, sy, sw, sh) => text(g, "10,000", sx + sw / 2, sy + sh / 2, 90, "#9fe0ff", "", "center")); } },
  { t0: 543.5, set: "office", cam: [760, 560, 1.3, 760, 520, 1.48], tr: "pan", dir: -1, d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "content", L: "desk", R: "coin", prop: "slice" }]])),
    o: (C) => { P.tag(C.g, "ITS FIRST REAL-WORLD PRICE", 1060, 280, 38, C.t, 549.0, 1e9, true); crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)); } },
  { t0: 551.9, set: "party", cam: [960, 600, 1.08, 960, 560, 1.22], tr: "pan", dir: 1, d: (C) => {
    [300, 560, 1360, 1620].forEach((x, i) => ch(C, extra(60 + i), x, 960, 0.58, K([[0, { expr: i % 2 ? "content" : "smile", R: "coin", prop: "slice", facing: x < 960 ? 1 : -1 }]])));
  } },
  { t0: 561.2, set: "hall", cam: [960, 540, 1.06, 960, 570, 1.2], tr: "pan", dir: 1, d: (C) => ch(C, LASZLO, 960, 900, 0.62, K([[0, { expr: "smile", L: "hold", R: "hold", prop: "trophy" }], [567.5, { expr: "content" }]])) },
  { t0: 570.9, set: "host", cam: [1150, 500, 1.4, 1150, 470, 1.55], tr: "pan", dir: -1, d: (C) => buck(C, 1150, 985, 0.95, K([[0, { expr: "flat" }], [572.6, { headTilt: 3 }], [574.0, { headTilt: 0 }]])) },
  { t0: 578.4, set: "office", cam: [800, 560, 1.25, 740, 540, 1.38], tr: "pan", dir: 1, d: (C) => typingLaszlo(C, "flat", 0, typeBob(C.t)),
    o: (C) => crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)) },
  { t0: 584.7, set: "host", cam: [1150, 500, 1.3, 1100, 480, 1.45], tr: "pan", dir: -1, d: (C) => {
    buck(C, 1300, 985, 0.95, K([[0, { expr: "flat", R: "coin", prop: "coin" }], [588.2, { L: "present" }], [591.3, { L: "down", expr: "worried" }], [596.3, { expr: "flat", headTilt: -3 }]]));
    const g = C.g; P.boxStack(g, 800, 660, 220, 1); P.tag(g, "SPEND IT", 800, 480, 36, C.t, 588.6, 594.2); P.tag(g, "OR KEEP IT?", 800, 480, 36, C.t, 594.4, 1e9, true);
  } },
  { t0: 599.9, set: "crypto", cam: [960, 620, 1.12, 960, 580, 1.26], tr: "pan", dir: 1, d: (C) => {
    P.coinPile(C.g, 960, 900, 700, 70, 12); P.tag(C.g, "DIGITAL GOLD", 960, 420, 46, C.t, 601.6, 1e9, true);
    P.at(C.g, 1560, 640, P.pop(C.t, 603.4), () => { P.sandwich(C.g, 1560, 640, 200); P.xMark(C.g, 1560, 640, 170, (C.t - 604.0) / 0.35); });
  } },
  { t0: 605.7, set: "office", cam: [760, 540, 1.35, 760, 520, 1.55], tr: "pan", dir: -1, d: (C) => ch(C, LASZLO, 760, 847, 0.72, K([[0, { expr: "content", L: "desk", R: "coin", prop: "slice" }]])),
    o: (C) => { P.tag(C.g, "MONEY THAT YOU SPEND", 1060, 280, 38, C.t, 612.9, 1e9, true); crtScreen(C, (x, y, w, h) => forumPage(C, x, y, w, h, 1)); } },
  // ================= 12 IRONIC ENDING =================
  { t0: 615.5, set: "street", cam: [1450, 610, 1.8, 1540, 620, 2.0], tr: "pan", dir: 1, d: (C) => {
    ch(C, DRIVER, 1450, 822, 0.25, K([[0, { expr: "smile", L: "hold", R: "hold", prop: "boxes", propN: 2, facing: 1 }], [621.0, { L: "down", R: "down", prop: null }]]));
    ch(C, LASZLO, 1612, 806, 0.25, K([[0, { expr: "smile", R: "cardOut", prop: "phone", facing: -1 }], [621.0, { L: "hold", R: "hold", prop: "boxes", propN: 2, expr: "content" }]]));
    if (C.t > 618.4 && C.t < 621) P.lightning(C.g, 1530, 650, 40);
  } },
  { t0: 624.4, set: "studio", cam: [960, 560, 1.12, 960, 540, 1.26], tr: "pan", dir: 1, d: (C) => { P.coinGlyph(C.g, 760, 560, 130); P.boxStack(C.g, 1180, 760, 260, 2); } },
  { t0: 628.3, set: "host", cam: [1150, 480, 1.5, 1150, 460, 1.66], tr: "pan", dir: -1, d: (C) => buck(C, 1150, 985, 0.95, K([[0, { expr: "flat", R: "coin", prop: "slice" }], [634.6, { expr: "smile", headTilt: 3 }]])) },
  { t0: 635.3, set: "paris", cam: [1100, 520, 1.1, 1180, 480, 1.25], tr: "pan", dir: 1, d: (C) => {
    ch(C, BUCK, 640, 1050, 0.48, K([[0, { expr: "flat", facing: 1, look: 0.6 }], [640.6, { expr: "o" }], [642.3, { expr: "wide" }]]), { talk: C.talk });
    P.soldSign(C.g, 1500, 640, 150, P.pop(C.t, 640.7)); 
  } },
  { t0: 643.5, set: "host", cam: [1150, 500, 1.3, 1150, 470, 1.45], tr: "pan", dir: -1, d: (C) => buck(C, 1450, 985, 0.95, K([[0, { expr: "smile" }], [646.3, { R: "point", facing: -1 }], [647.9, { R: "wave", facing: 0 }], [649.0, { R: "down", expr: "flat" }]])) },
  { t0: 649.0, set: "host", cam: [1450, 470, 1.55, 1450, 450, 1.7], tr: "cut", d: (C) => buck(C, 1450, 985, 0.95, K([[0, { expr: "flat", headTilt: -2 }], [652.4, { expr: "smile", headTilt: 0 }]])) },
];

function cryptoBuck(C: Ctx) {
  const k = K([[0, { expr: "flat", facing: 1, look: 0.5 }], [346.0, { expr: "o" }], [347.4, { expr: "flat" }], [358.6, { expr: "wide" }], [360.4, { expr: "flat", headTilt: -3 }],
    [370.6, { expr: "wide", headTilt: 0 }], [372.0, { expr: "worried" }], [376.4, { expr: "wide" }], [378.0, { expr: "flat" }], [383.2, { expr: "wide" }], [386.0, { expr: "flat" }], [391.9, { expr: "worried", headTilt: 3 }]]);
  ch(C, BUCK, 330, 1010, 0.56, k, { talk: C.talk });
}
function bedLaszlo(C: Ctx, expr: any) {
  const g = C.g; g.save(); g.translate(830, 650); g.rotate(-Math.PI / 2);
  drawChar(g, LASZLO, 0, 0, 0.6, { expr, L: "down", R: "down", look: 0, blink: expr === "flat" ? undefined : 0, breathe: 0.5 }, C.t);
  g.restore();
}
export const camAt = (s: Shot, t: number, dur: number) => {
  const u = clamp(t / dur), m = 0.7 * u + 0.3 * ease(u); // never zero velocity inside a shot
  const [x0, y0, z0, x1, y1, z1] = s.cam; let z = lerp(z0, z1, m), x = lerp(x0, x1, m), y = lerp(y0, y1, m);
  z = Math.max(1.04, z); const mx = 960 / z + 10, my = 540 / z + 10;
  x = clamp(x, mx, 1920 - mx); y = clamp(y, my, 1080 - my);
  return { x, y, z };
};
