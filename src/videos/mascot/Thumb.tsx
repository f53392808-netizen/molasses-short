import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, INK, mix } from "../molasses/toon";
import { BUCK } from "./Mascot";

const W = 1280, H = 720;
// Crayon Capital style: dark cinematic room, one hero prop glowing, big centred character
export const PizzaThumb: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!;
    const ink = (lw = 7) => { g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); };
    const poly = (pts: number[][], fill: string, lw = 7) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = fill; g.fill(); ink(lw); };
    // wall: painted gradient, lamp-lit like Crayon Capital rooms
    const wall = g.createRadialGradient(240, 300, 40, 640, 300, 1000);
    wall.addColorStop(0, "#c9a77a"); wall.addColorStop(0.5, "#8f6f57"); wall.addColorStop(1, "#4d3a3a");
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 56) { g.fillStyle = "rgba(60,30,20,0.07)"; g.fillRect(x, 0, 4, 480); }
    // wainscot strip + shadow at the desk line
    const ao = g.createLinearGradient(0, 400, 0, 472); ao.addColorStop(0, "rgba(30,15,15,0)"); ao.addColorStop(1, "rgba(30,15,15,0.45)");
    g.fillStyle = ao; g.fillRect(0, 400, W, 72);
    // window with curtains, right side
    g.beginPath(); g.rect(900, 70, 300, 300); g.fillStyle = "#5e432f"; g.fill(); ink(7);
    const sky = g.createLinearGradient(0, 86, 0, 354); sky.addColorStop(0, "#14244a"); sky.addColorStop(1, "#3a4f8c");
    g.fillStyle = sky; g.fillRect(916, 86, 268, 268);
    g.beginPath(); g.arc(1130, 130, 20, 0, Math.PI * 2); g.fillStyle = "#fff0b8"; g.fill();
    [[916, 250, 50], [966, 215, 44], [1010, 265, 60], [1070, 225, 46], [1116, 255, 68]].forEach(([x, y, w], i) => {
      g.fillStyle = i % 2 ? "#1d2756" : "#26326a"; g.fillRect(x, y, w, 354 - y);
      for (let yy = y + 12; yy < 344; yy += 22) for (let xx = x + 8; xx < x + w - 8; xx += 16) if (((xx * 7 + yy * 3 + i) % 5) < 2) { g.fillStyle = "#ffd96a"; g.fillRect(xx, yy, 7, 10); }
    });
    g.fillStyle = "#5e432f"; g.fillRect(1044, 86, 12, 268); g.fillRect(916, 214, 268, 10);
    for (const [x0, dir] of [[870, 1], [1230, -1]] as [number, number][]) {
      g.beginPath(); g.moveTo(x0 - 40, 40); g.lineTo(x0 + 40, 40); g.quadraticCurveTo(x0 + 50 * dir, 260, x0 + 30, 470); g.lineTo(x0 - 50, 470); g.quadraticCurveTo(x0 - 30, 250, x0 - 40, 40); g.closePath();
      const cg2 = g.createLinearGradient(x0 - 50, 0, x0 + 50, 0); cg2.addColorStop(0, "#7e2f2f"); cg2.addColorStop(0.5, "#a8443c"); cg2.addColorStop(1, "#6a2626");
      g.fillStyle = cg2; g.fill(); ink(6);
      for (const k of [-20, 0, 20]) { g.beginPath(); g.moveTo(x0 + k, 60); g.quadraticCurveTo(x0 + k + 10 * dir, 260, x0 + k, 460); g.strokeStyle = "rgba(40,10,10,0.35)"; g.lineWidth = 3; g.stroke(); }
    }
    // floor lamp left, warm cone
    const lc = g.createRadialGradient(170, 200, 10, 170, 260, 420); lc.addColorStop(0, "rgba(255,226,150,0.55)"); lc.addColorStop(1, "rgba(255,226,150,0)");
    g.fillStyle = lc; g.fillRect(0, 0, 640, 600);
    g.beginPath(); g.rect(160, 230, 16, 250); g.fillStyle = "#6b4a2f"; g.fill(); ink(5);
    poly([[100, 230], [240, 230], [205, 130], [135, 130]], "#efe2c4", 6);
    g.beginPath(); g.moveTo(112, 210); g.lineTo(228, 210); g.strokeStyle = "rgba(120,90,50,0.4)"; g.lineWidth = 3; g.stroke();
    // bookshelf left-centre
    g.beginPath(); g.rect(250, 150, 170, 320); g.fillStyle = "#6e4a30"; g.fill(); ink(6);
    const bcol = ["#3f6f8a", "#a8443c", "#d9a441", "#4f7a4a", "#7a5a8a", "#c46a3a"];
    for (let r = 0; r < 3; r++) { const y0 = 165 + r * 100; g.fillStyle = "#4e3322"; g.fillRect(256, y0 + 84, 158, 8);
      let x = 262; for (let i = 0; x < 405; i++) { const w = 14 + ((i * 7 + r * 3) % 4) * 4, h = 58 + ((i * 5 + r) % 3) * 10; g.beginPath(); g.rect(x, y0 + 84 - h, w, h); g.fillStyle = bcol[(i + r * 2) % 6]; g.fill(); ink(2.5); x += w + 2; } }
    // framed "BITCOIN 0.003" sticky note poster
    g.save(); g.translate(700, 120); g.rotate(-0.04);
    g.beginPath(); g.rect(0, 0, 130, 90); g.fillStyle = "#fff3a8"; g.fill(); ink(5);
    g.fillStyle = INK; g.font = "900 20px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("1 BTC =", 65, 30); g.fillText("$0.004", 65, 60); g.restore();
    // old CRT on the desk, right of Buck
    g.beginPath(); g.moveTo(870, 300); g.lineTo(1050, 300); g.lineTo(1064, 474); g.lineTo(856, 474); g.closePath();
    const mg = g.createLinearGradient(856, 0, 1064, 0); mg.addColorStop(0, "#e2dbc4"); mg.addColorStop(1, "#b9b19a"); g.fillStyle = mg; g.fill(); ink(7);
    g.beginPath(); g.rect(888, 320, 144, 112); g.fillStyle = "#123a22"; g.fill(); ink(5);
    g.fillStyle = "#5dff8a"; g.font = "bold 15px monospace"; g.textAlign = "left"; g.textBaseline = "alphabetic";
    ["> PIZZA FOR", "  BITCOINS?", "> 10,000 BTC", "> 2 LARGE"].forEach((t, i) => g.fillText(t, 896, 342 + i * 23));
    // desk with wood grain
    g.beginPath(); g.rect(-10, 470, W + 20, 260); const dg = g.createLinearGradient(0, 470, 0, 720); dg.addColorStop(0, "#8a5a36"); dg.addColorStop(1, "#4e3020"); g.fillStyle = dg; g.fill(); ink(7);
    for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(0, 500 + i * 32); g.bezierCurveTo(300, 490 + i * 32, 800, 515 + i * 32, W, 498 + i * 32); g.strokeStyle = "rgba(40,20,10,0.25)"; g.lineWidth = 2.5; g.stroke(); }
    // Buck's soft shadow on the wall
    g.beginPath(); g.ellipse(668, 330, 230, 200, 0, 0, Math.PI * 2); g.fillStyle = "rgba(40,20,20,0.22)"; g.fill();
    // darken room (cinematic)
    g.fillStyle = "rgba(20,14,34,0.12)"; g.fillRect(0, 0, W, H);
    // golden light rising from the box (behind Buck)
    g.save(); g.translate(640, 640);
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.2; g.beginPath(); g.moveTo(-30, 0); g.lineTo(Math.cos(a - 0.05) * 900, Math.sin(a - 0.05) * 900); g.lineTo(Math.cos(a + 0.05) * 900, Math.sin(a + 0.05) * 900); g.lineTo(30, 0); g.fillStyle = "rgba(255,205,90,0.08)"; g.fill(); }
    g.restore();
    // Buck, centred, hands on cheeks
    g.save(); g.translate(175, -62); g.scale(1.55, 1.55);
    bodyFront(new Pen(g), BUCK, { mode: "stand", expr: "shock", seed: 7, noArms: true } as any);
    const P = new Pen(g), u = 2.36, armCol = mix(BUCK.jacket, INK, 0.18);
    for (const sd of [-1, 1]) {
      const S: [number, number] = [300 + sd * 76, 412], E: [number, number] = [300 + sd * 140, 392], Hd: [number, number] = [300 + sd * 112, 336];
      P.band([S, [S[0] + sd * 40, 412], E, [E[0] - sd * 6, 380], Hd], armCol, 9.5 * u, 1.6 * u, "round");
      P.ell(Hd[0], Hd[1], 23, 28, BUCK.skin!, 1.8 * u);
      for (const k of [-1, 0, 1]) P.stroke([[Hd[0] - sd * 6, Hd[1] + k * 11 - 2], [Hd[0] - sd * 18, Hd[1] + k * 11 - 4]], 1.2 * u, INK);
    }
    g.restore();
    // warm under-light on Buck
    const ul = g.createRadialGradient(640, 700, 40, 640, 640, 520); ul.addColorStop(0, "rgba(255,190,70,0.16)"); ul.addColorStop(1, "rgba(255,190,70,0)");
    g.fillStyle = ul; g.fillRect(0, 150, W, 570);
    // open pizza box, front centre
    poly([[300, 600], [980, 600], [1030, 735], [250, 735]], "#e2bd84");
    const cx = 640, cy = 668;
    g.beginPath(); g.ellipse(cx, cy, 300, 62, 0, 0, Math.PI * 2); g.fillStyle = "#d98c3a"; g.fill(); ink(7);
    g.beginPath(); g.ellipse(cx, cy - 3, 268, 52, 0, 0, Math.PI * 2); g.fillStyle = "#f7c64a"; g.fill(); ink(3);
    [[-190, -8], [-110, -28], [-30, 18], [70, -26], [160, 8], [220, -14], [-160, 24], [110, 30]].forEach(([dx, dy]) => { g.beginPath(); g.ellipse(cx + dx, cy + dy, 28, 9, 0, 0, Math.PI * 2); g.fillStyle = "#c63a2f"; g.fill(); ink(3); });
    const coin = (x: number, y: number, r: number) => {
      g.beginPath(); g.ellipse(x, y + 7, r, r * 0.42, 0, 0, Math.PI * 2); g.fillStyle = "#b57d12"; g.fill(); ink(5);
      g.beginPath(); g.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2); g.fillStyle = "#ffc93a"; g.fill(); ink(5);
      g.save(); g.translate(x, y); g.scale(1, 0.45); g.fillStyle = "#9a6408"; g.font = `bold ${r * 1.1}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("B", 0, 2); g.restore();
    };
    coin(560, 650, 46); coin(680, 668, 50); coin(790, 646, 40); coin(470, 676, 36);
    [[420, 610], [860, 615], [640, 600]].forEach(([x, y]) => { g.save(); g.translate(x, y); g.fillStyle = "#fff6c8"; g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 6 : 22; const a = i * Math.PI / 4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); });
    // vignette
    const vg = g.createRadialGradient(640, 400, 280, 640, 380, 860); vg.addColorStop(0, "rgba(10,6,22,0)"); vg.addColorStop(1, "rgba(10,6,22,0.7)");
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
