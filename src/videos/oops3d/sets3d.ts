// ep01 3D: the story sets added for the full episode (office extras, pizza shop interior, Jeremy's room, market stalls,
// lottery square, chart square, hall-of-fame stage, cinema, Florida sign, traffic). Per-frame state in update().
import * as THREE from "three";
import { M, cv, rnd, BoxFn, txt, flat } from "./util3d";
import { NOINK } from "../molasses/ink";
import { coinGlyph, pizzaTop } from "../oops/cast";
import { Pen } from "../molasses/toon";
import { HOUSE, SHOP, JROOM, LOT, CH, chartH, yr2x, clamp01, easeOut, smooth, Shot, riderYear } from "./story3d";

const FC = ["#e8402f", "#ffd21f", "#2f9be0", "#3fbf6a", "#f07ad0"];
export type Screen = { c: HTMLCanvasElement; tex: THREE.CanvasTexture; key: string };
const mkScreen = (w = 512, h = 384): Screen => { const c = document.createElement("canvas"); c.width = w; c.height = h; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return { c, tex, key: "" }; };
const scrMesh = (S: Screen, w: number, h: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: S.tex, fog: false, toneMapped: false, color: new THREE.Color(0.9, 0.9, 0.9) })); m.layers.set(NOINK); return m; };
const pizzaTex = () => cv(256, 256, (g) => { const p = new Pen(g); pizzaTop(p, 128, 128, 120); });
const sign = (w: number, h: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void, px = 256) => {
  const W = px, H = Math.round(px * h / w), t = cv(W, H, (g) => draw(g, W, H));
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: t }));
};

export class Sets {
  shells: Record<string, THREE.Object3D[]> = { house: [], shop: [], room: [] };
  laptop: Screen = mkScreen(); gpuFans: THREE.Object3D[] = []; gpuRig!: THREE.Group; officeCoins: THREE.Object3D[] = []; officeBoxes: THREE.Object3D[] = [];
  tops: THREE.Object3D[][] = []; dough!: THREE.Object3D; drum!: THREE.Group; clock: Screen = mkScreen(256, 128); rider!: THREE.Group; exch!: THREE.Group;
  traffic: THREE.Group[] = []; soldShop!: THREE.Object3D; soldStreet: THREE.Object3D[] = []; trophyStand!: THREE.Object3D; prize: THREE.Object3D[] = []; dealsBanner!: THREE.Object3D;
  q!: THREE.Object3D; lawnBoxes: THREE.Object3D[] = []; vault!: THREE.Object3D;
  constructor(R: THREE.Group, box: BoxFn) {
    const H = HOUSE, f = H.floor;
    // ---------- office extras ----------
    box(80.05, 80.3, f, f + 0.48, -20.7, -20.15, M("#e7e0cc")); box(80.08, 80.27, f + 0.36, f + 0.4, -20.151, -20.14, M("#3a3a44"), false); // tower PC + drive slot
    const cab = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(80.1, f + 0.4, -20.72), new THREE.Vector3(79.6, f + 0.25, -20.82), new THREE.Vector3(78.6, f + 0.74, -20.8), new THREE.Vector3(78.3, f + 0.8, -20.62)]), 16, 0.012, 5), M("#2a2a33")); R.add(cab);
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 16), M("#e8402f")); mug.position.set(77.5, f + 0.83, -19.95); mug.castShadow = true; R.add(mug);
    for (let k = 0; k < 4; k++) { const pp = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.004, 0.29), M("#fbfbf4")); pp.position.set(80.15 + 0.01 * k, f + 0.782 + k * 0.006, -19.98); pp.rotation.y = 0.2 * Math.sin(k * 2.1); R.add(pp); }
    const lampA = new THREE.Group(); lampA.position.set(80.3, f + 0.78, -20.6); R.add(lampA);
    box(-0.08, 0.08, 0, 0.02, -0.08, 0.08, M("#3a3a44"), true, lampA); box(-0.012, 0.012, 0.02, 0.42, -0.012, 0.012, M("#3a3a44"), true, lampA);
    const shadeL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.13, 16, 1, true), M("#2f8a57", null, THREE.DoubleSide)); shadeL.position.set(0, 0.44, 0.04); shadeL.rotation.x = 0.5; lampA.add(shadeL);
    // GPU rig on the left end of the desk (appears when Laszlo installs it)
    this.gpuRig = new THREE.Group(); this.gpuRig.position.set(77.0, f + 0.78, -20.45); R.add(this.gpuRig);
    box(-0.02, 0.32, 0, 0.03, -0.2, 0.2, M("#4a4f5a"), true, this.gpuRig);
    for (let k = 0; k < 2; k++) {
      box(0.02 + k * 0.15, 0.04 + k * 0.15, 0.03, 0.2, -0.17, 0.17, M("#2f7a4a"), true, this.gpuRig);
      for (let j = 0; j < 2; j++) { const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 6).rotateZ(Math.PI / 2), M("#3a3a44")); fan.position.set(0.05 + k * 0.15, 0.11, -0.08 + j * 0.16); this.gpuRig.add(fan); this.gpuFans.push(fan); }
    }
    // bed (left of the room) with pillow + blanket
    box(67.35, 69.45, f, f + 0.42, -20.8, -18.7, M("#7a5230")); box(67.4, 69.4, f + 0.42, f + 0.58, -20.75, -18.75, M("#f4efe6")); box(67.45, 68.0, f + 0.58, f + 0.68, -20.6, -18.9, M("#ffffff"));
    box(68.6, 69.42, f + 0.58, f + 0.64, -20.77, -18.73, M("#4f86b8"));
    // coins pile next to the desk (mining "by the thousands") + box stack in the office corner
    for (let k = 0; k < 40; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 16), M(k % 2 ? "#ffc93a" : "#f2b62a")); const a = k * 2.4, r = 0.35 * Math.sqrt((k % 20) / 20); c.position.set(76.0 + Math.cos(a) * r, f + 0.013 + Math.floor(k / 20) * 0.026 + 0.0005 * k, -19.1 + Math.sin(a) * r * 0.8); c.userData.k = k; c.castShadow = true; R.add(c); this.officeCoins.push(c); }
    const boxTopT = cv(256, 256, (g) => { g.fillStyle = "#e7c38d"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#b48a52"; g.lineWidth = 6; g.strokeRect(10, 10, 236, 236); pizzaTop(new Pen(g), 128, 128, 60); });
    const pboxM = M("#e7c38d"), boxMats = [pboxM, pboxM, M("#ffffff", boxTopT), pboxM, pboxM, pboxM];
    for (let k = 0; k < 12; k++) { const b = box(-0.3, 0.3, 0, 0.09, -0.3, 0.3, boxMats as any, true); b.position.set(70.6 + 0.02 * Math.sin(k), f + 0.001 + k * 0.0905, -20.35); b.rotation.y = 0.1 * Math.sin(k * 1.7); this.officeBoxes.push(b); }
    // ---------- pizza shop (x 35..47, z -22..-12, front wall z -12, door at x 41) ----------
    const S = SHOP, wallM = M("#f6efe2"), red = M("#c8363a"), sh = (o: THREE.Object3D) => { this.shells.shop.push(o); return o; };
    box(S.x0, S.x1, -0.1, 0.1, S.z0, S.z1, M("#e9dcc6", cv(256, 256, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? "#f4efe6" : "#c8363a"; g.fillRect(i * 32, j * 32, 32, 32); } })), false);
    box(S.x0, S.x0 + 0.2, 0.1, 4.6, S.z0, S.z1, wallM); box(S.x1 - 0.2, S.x1, 0.1, 4.6, S.z0, S.z1, wallM); box(S.x0, S.x1, 0.1, 4.6, S.z0, S.z0 + 0.2, M("#f3e3c8"));
    box(S.x0, S.x1, 3.6, 3.7, S.z0, S.z1, M("#f4efe6"), false); // ceiling (no sky inside)
    sh(box(S.x0, S.x1, 3.7, 4.6, S.z0, S.z1, red)); // roof block
    const zf = S.z1;
    sh(box(S.x0, 40.3, 0.1, 4.6, zf - 0.2, zf, wallM)); sh(box(41.7, S.x1, 0.1, 4.6, zf - 0.2, zf, wallM)); sh(box(40.3, 41.7, 2.5, 4.6, zf - 0.2, zf, wallM));
    for (const wx of [37.6, 44.4]) sh(box(wx - 1.6, wx + 1.6, 0.9, 2.5, zf, zf + 0.04, M("#9fd4ef"), false));
    const awn = cv(256, 64, (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#c8363a"; g.fillRect(i * 16, 0, 16, 64); } });
    const aw = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.08, 1.6), M("#ffffff", awn)); aw.position.set(41, 2.95, zf + 0.75); aw.rotation.x = 0.28; aw.castShadow = true; R.add(aw); sh(aw);
    const shopSign = sign(6, 1.1, (g, W, Hh) => { g.fillStyle = "#c8363a"; g.fillRect(0, 0, W, Hh); g.strokeStyle = "#241726"; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, Hh - 8); pizzaTop(new Pen(g), Hh * 0.55, Hh / 2, Hh * 0.36); txt(g, "PIZZA", W * 0.58, Hh * 0.7, Hh * 0.55, "#fff7e0", "center"); }, 512);
    shopSign.position.set(41, 3.55, zf + 0.06); R.add(shopSign); sh(shopSign);
    // counter + register + oven + menu board + box stacks + wall phone
    box(37, 45, 0.1, 1.05, -17.2, -16.4, M("#c8363a")); box(36.9, 45.1, 1.05, 1.11, -17.3, -16.3, M("#f4efe6"));
    box(43.4, 43.9, 1.11, 1.36, -16.95, -16.6, M("#4a4f5a")); box(43.45, 43.85, 1.36, 1.5, -16.95, -16.9, M("#2a3a2a"));
    box(37.5, 40.5, 0.1, 2.1, -21.8, -20.4, M("#8a8f9a")); box(37.8, 40.2, 0.9, 1.6, -20.41, -20.39, M("#e8902a"), false); box(37.6, 40.4, 2.1, 2.4, -21.6, -20.8, M("#6a6f7a"));
    const menu = sign(3.4, 1.4, (g, W, Hh) => { g.fillStyle = "#2a2a33"; g.fillRect(0, 0, W, Hh); g.strokeStyle = "#a8743e"; g.lineWidth = 12; g.strokeRect(6, 6, W - 12, Hh - 12); txt(g, "MENU", W / 2, 50, 40, "#ffd21f", "center"); for (let i = 0; i < 4; i++) { g.fillStyle = "#f4efe6"; g.fillRect(30, 80 + i * 32, 150 + (i * 37) % 80, 10); g.fillRect(W - 90, 80 + i * 32, 60, 10); } }, 512);
    menu.position.set(43.2, 2.5, S.z0 + 0.21); R.add(menu);
    for (let s = 0; s < 3; s++) for (let k = 0; k < 6 + s; k++) { const b = box(-0.3, 0.3, 0, 0.09, -0.3, 0.3, boxMats as any, true); b.position.set(45.6 - s * 0.68, 0.1 + k * 0.0905 + 0.0005 * s, -21.3); b.rotation.y = 0.05 * Math.sin(k + s); }
    box(36.0, 36.04, 1.45, 1.75, -18.4, -18.2, M("#2a2a33"));
    // dough + toppings on the counter (appear on each topping word)
    this.dough = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 32), M("#f2d6a6")); this.dough.position.set(40.2, 1.125, -16.8); R.add(this.dough);
    const sauce = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.008, 32), M("#d0402f")); sauce.position.set(0, 0.019, 0); this.dough.add(sauce);
    const TOP: [string, () => THREE.BufferGeometry][] = [["#f4f0e0", () => new THREE.TorusGeometry(0.035, 0.008, 5, 12).rotateX(Math.PI / 2)], ["#3f9a4a", () => new THREE.BoxGeometry(0.06, 0.012, 0.025)],
      ["#7a4a2a", () => new THREE.SphereGeometry(0.022, 8, 6)], ["#d8c8a8", () => new THREE.SphereGeometry(0.03, 8, 6, 0, 6.3, 0, 1.4)], ["#b8322c", () => new THREE.CylinderGeometry(0.04, 0.04, 0.008, 14)]];
    TOP.forEach(([col, geo], k) => { const arr: THREE.Object3D[] = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(geo(), M(col)); const a = i * 2.39 + k * 1.1, r = 0.22 * Math.sqrt((i + 0.5) / 7); m.position.set(Math.cos(a) * r, 0.03 + 0.003 * k, Math.sin(a) * r); m.rotation.y = a; this.dough.add(m); arr.push(m); } this.tops.push(arr); });
    // "SOLD" + "DEALS" signs
    const soldT = cv(256, 128, (g) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#e8402f"; g.lineWidth = 14; g.strokeRect(7, 7, 242, 114); txt(g, "SOLD", 128, 92, 76, "#e8402f", "center"); });
    const soldMat = new THREE.MeshLambertMaterial({ map: soldT });
    this.soldShop = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), soldMat); this.soldShop.position.set(37.6, 1.7, zf + 0.12); R.add(this.soldShop);
    for (let k = 0; k < 9; k++) { const x = -20 + k * 14 + 3, side = k % 2 ? 1 : -1; const s = new THREE.Group(); box(-0.04, 0.04, 0, 1.3, -0.04, 0.04, M("#7a5230"), true, s); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), soldMat); p.position.set(0, 1.25, side * 0.05); if (side < 0) p.rotation.y = 0; else p.rotation.y = Math.PI; s.add(p); s.position.set(x, 0, side * 9.5); R.add(s); this.soldStreet.push(s); }
    this.dealsBanner = sign(5, 0.9, (g, W, Hh) => { g.fillStyle = "#ffd21f"; g.fillRect(0, 0, W, Hh); g.strokeStyle = "#241726"; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, Hh - 8); txt(g, "PIZZA DAY DEALS", W / 2, Hh * 0.68, Hh * 0.5, "#241726", "center"); coinGlyph(g, 36, Hh / 2, 22, false); coinGlyph(g, W - 36, Hh / 2, 22, false); }, 512);
    this.dealsBanner.position.set(41, 2.6, zf + 0.07); R.add(this.dealsBanner);
    // ---------- Jeremy's room (north side x 100..110, z 12..21; front wall z 12 faces the road) ----------
    const J = JROOM, jsh = (o: THREE.Object3D) => { this.shells.room.push(o); return o; }, jw = M("#f2dcae"), ji = M("#cfe0f2");
    box(J.x0, J.x1, 0, 0.2, J.z0, J.z1, M("#b48a5a", cv(256, 256, (g) => { g.fillStyle = "#b48a5a"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#9a7448"; g.lineWidth = 3; for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } })), false);
    box(J.x0, J.x0 + 0.2, 0.2, 3.4, J.z0, J.z1, ji); box(J.x1 - 0.2, J.x1, 0.2, 3.4, J.z0, J.z1, ji);
    box(J.x0, 103.6, 0.2, 3.4, J.z1 - 0.2, J.z1, ji); box(106.4, J.x1, 0.2, 3.4, J.z1 - 0.2, J.z1, ji); box(103.6, 106.4, 0.2, 1.2, J.z1 - 0.2, J.z1, ji); box(103.6, 106.4, 2.5, 3.4, J.z1 - 0.2, J.z1, ji); // back wall with a window hole
    box(103.5, 106.5, 1.15, 1.22, J.z1 - 0.3, J.z1 + 0.05, M("#ffffff"), false);
    box(J.x0, J.x1, 3.4, 3.48, J.z0, J.z1, M("#f4efe6"), false);
    jsh(box(J.x0, J.x1, 3.48, 4.2, J.z0 - 0.3, J.z1 + 0.3, M("#4a6a9a")));
    jsh(box(J.x0, 104.4, 0.2, 3.4, J.z0, J.z0 + 0.2, jw)); jsh(box(105.6, J.x1, 0.2, 3.4, J.z0, J.z0 + 0.2, jw)); jsh(box(104.4, 105.6, 2.4, 3.4, J.z0, J.z0 + 0.2, jw));
    jsh(box(104.4, 105.6, 0.2, 2.4, J.z0 - 0.02, J.z0 + 0.04, M("#2f6fb5")));
    for (const wx of [101.8, 108.2]) jsh(box(wx - 0.9, wx + 0.9, 1.1, 2.3, J.z0 - 0.04, J.z0, M("#9fd4ef"), false));
    // desk (faces the road side: Jeremy sits at z 18.9 facing -z), laptop (screen faces +z, toward him), tall chair back, bed, poster, lamp
    box(103.4, 106.6, 0.95, 1.0, 17.2, 18.1, M("#f4efe6")); for (const [a, b] of [[103.5, 17.3], [106.5, 17.3], [103.5, 18.0], [106.5, 18.0]]) box(a - 0.03, a + 0.03, 0.2, 0.95, b - 0.03, b + 0.03, M("#8a8f9a"));
    const lap = new THREE.Group(); lap.position.set(105.0, 1.0, 17.75); R.add(lap);
    box(-0.25, 0.25, 0, 0.02, -0.17, 0.17, M("#8a8f9a"), true, lap);
    const lid = new THREE.Group(); lid.position.set(0, 0.02, -0.17); lid.rotation.x = 0.28; lap.add(lid); box(-0.25, 0.25, 0, 0.34, -0.015, 0, M("#8a8f9a"), true, lid);
    const ls = scrMesh(this.laptop, 0.46, 0.3); ls.position.set(0, 0.17, 0.003); lid.add(ls);
    box(104.55, 105.45, 0.2, 0.62, 19.2, 19.7, M("#2f2f3a")); box(104.55, 105.45, 0.62, 1.42, 19.62, 19.74, M("#2f2f3a")); // chair (seat 0.62) + back (hides seated legs from behind)
    box(108.2, 109.8, 0.2, 0.62, 13.6, 16.8, M("#7a5230")); box(108.25, 109.75, 0.62, 0.78, 13.65, 16.75, M("#e8402f")); box(108.3, 109.7, 0.78, 0.86, 16.0, 16.7, M("#ffffff"));
    const post = sign(1.0, 1.4, (g, W, Hh) => { g.fillStyle = "#241726"; g.fillRect(0, 0, W, Hh); g.fillStyle = "#3fbf6a"; g.fillRect(12, 12, W - 24, Hh - 24); g.fillStyle = "#ffd21f"; g.beginPath(); g.arc(W / 2, Hh * 0.38, W * 0.28, 0, 7); g.fill(); g.fillStyle = "#241726"; for (let i = 0; i < 3; i++) g.fillRect(40, Hh * 0.7 + i * 26, W - 80 - i * 40, 10); });
    post.position.set(J.x0 + 0.22, 2.0, 15.0); post.rotation.y = Math.PI / 2; R.add(post);
    // Jeremy's car + Florida sign on the north sidewalk
    const car = new THREE.Group(); car.position.set(96.5, 0.02, 3.0); R.add(car);
    box(-2.1, 2.1, 0.35, 1.15, -0.9, 0.9, M("#d08a3a"), true, car); box(-1.2, 1.1, 1.15, 1.75, -0.82, 0.82, M("#bfe4f7"), true, car);
    for (const [a, b] of [[-1.3, -0.85], [1.3, -0.85], [-1.3, 0.85], [1.3, 0.85]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16).rotateX(Math.PI / 2), M("#2a2a33")); w.position.set(a, 0.36, b); car.add(w); }
    box(91.4, 91.5, 0.15, 2.9, 6.55, 6.65, M("#8a8f9a"));
    const fl = sign(1.8, 0.7, (g, W, Hh) => { g.fillStyle = "#1f7a4a"; g.fillRect(0, 0, W, Hh); g.strokeStyle = "#ffffff"; g.lineWidth = 6; g.strokeRect(8, 8, W - 16, Hh - 16); txt(g, "FLORIDA", W * 0.42, Hh * 0.66, Hh * 0.42, "#ffffff", "center"); g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(W - 70, Hh * 0.3); g.lineTo(W - 22, Hh / 2); g.lineTo(W - 70, Hh * 0.7); g.fill(); g.fillRect(W - 100, Hh * 0.44, 40, Hh * 0.12); }, 512);
    fl.position.set(91.45, 2.45, 6.52); fl.rotation.y = Math.PI; R.add(fl); const fl2 = fl.clone(); fl2.rotation.y = 0; fl2.position.z = 6.68; R.add(fl2);
    // ---------- market stalls (sandwich, socks) + newspaper stand on the south sidewalk ----------
    const stall = (x: number, label: string, col: string, goods: (g: THREE.Group) => void) => {
      const g = new THREE.Group(); g.position.set(x, 0.15, -6.3); R.add(g);
      box(-1.0, 1.0, 0.75, 0.82, -0.4, 0.4, M("#f4efe6"), true, g); for (const sx of [-0.9, 0.9]) for (const sz of [-0.32, 0.32]) box(sx - 0.03, sx + 0.03, 0, 0.75, sz - 0.03, sz + 0.03, M("#7a5230"), true, g);
      for (const sx of [-1.0, 1.0]) box(sx - 0.03, sx + 0.03, 0.82, 2.25, -0.38, -0.32, M("#7a5230"), true, g);
      const can = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 1.2), M("#ffffff", cv(128, 32, (q) => { for (let i = 0; i < 8; i++) { q.fillStyle = i % 2 ? "#ffffff" : col; q.fillRect(i * 16, 0, 16, 32); } }))); can.position.set(0, 2.3, -0.05); can.rotation.x = -0.18; can.castShadow = true; g.add(can);
      const sg = sign(1.6, 0.4, (q, W, Hh) => { q.fillStyle = "#fffbe8"; q.fillRect(0, 0, W, Hh); q.strokeStyle = "#241726"; q.lineWidth = 6; q.strokeRect(3, 3, W - 6, Hh - 6); txt(q, label, W / 2, Hh * 0.72, Hh * 0.56, "#241726", "center"); }, 512);
      sg.position.set(0, 2.0, -0.33); g.add(sg); goods(g);
    };
    stall(7, "SANDWICHES", "#3fbf6a", (g) => { for (let k = 0; k < 4; k++) { const sw = new THREE.Group(); box(-0.13, 0.13, 0, 0.03, -0.08, 0.08, M("#e8c27a"), true, sw); box(-0.13, 0.13, 0.03, 0.05, -0.08, 0.08, M("#4fae4a"), false, sw); box(-0.13, 0.13, 0.05, 0.08, -0.08, 0.08, M("#e8c27a"), true, sw); sw.position.set(-0.6 + k * 0.4, 0.82, 0.05); g.add(sw); } });
    stall(12.5, "SOCKS", "#7b5ac9", (g) => { box(-0.8, 0.8, 1.55, 1.58, -0.36, -0.33, M("#7a5230"), false, g); for (let k = 0; k < 6; k++) { const sk = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.36, 0.03), M(FC[k % 5])); sk.position.set(-0.6 + k * 0.24, 1.36, -0.3); g.add(sk); } });
    const np = new THREE.Group(); np.position.set(27, 0.15, -6.4); R.add(np);
    box(-0.45, 0.45, 0, 1.1, -0.3, 0.3, M("#2f6fb5"), true, np);
    const paper = sign(0.7, 0.5, (q, W, Hh) => { q.fillStyle = "#f4f1e8"; q.fillRect(0, 0, W, Hh); txt(q, "DAILY NEWS", W / 2, 30, 26, "#241726", "center"); q.fillStyle = "#241726"; q.fillRect(10, 38, W - 20, 3); pizzaTop(new Pen(q), 70, 110, 52); txt(q, "PIZZA!", 175, 110, 34, "#c8363a", "center"); for (let i = 0; i < 4; i++) { q.fillStyle = "#8a8a8a"; q.fillRect(130, 130 + i * 12, 100, 5); } }, 256);
    paper.position.set(0, 0.85, 0.305); np.add(paper);
    // ---------- lottery square (north, x -24..14, z 12..44): paving, drum, clock, computer tables, CPU desk, GPU crowd area ----------
    const L0 = LOT;
    box(-26, 16, -0.1, 0.08, 8, 46, M("#e2d6be", cv(256, 256, (g) => { g.fillStyle = "#e2d6be"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#cbbd9f"; g.lineWidth = 4; for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); } })), false);
    this.drum = new THREE.Group(); this.drum.position.set(L0.drum[0], 3.0, L0.drum[2]); R.add(this.drum);
    box(L0.drum[0] - 0.15, L0.drum[0] + 0.15, 0.05, 3.0, L0.drum[2] - 2.0, L0.drum[2] - 1.8, M("#c8363a")); box(L0.drum[0] - 0.15, L0.drum[0] + 0.15, 0.05, 3.0, L0.drum[2] + 1.8, L0.drum[2] + 2.0, M("#c8363a"));
    for (const zz of [-1.5, 0, 1.5]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.06, 8, 32), M("#ffd21f")); ring.position.z = zz; this.drum.add(ring); }
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, bar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.0, 6).rotateX(Math.PI / 2), M("#ffd21f")); bar.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0); this.drum.add(bar); }
    for (let k = 0; k < 18; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), M(FC[k % 5])); b.position.set(Math.cos(k * 1.3) * (0.4 + 0.9 * rnd(k)), -0.9 + 0.5 * rnd(k + 3), -1.3 + 2.6 * rnd(k + 7)); this.drum.add(b); }
    const clockB = new THREE.Group(); clockB.position.set(L0.clock[0], 0, L0.clock[2]); R.add(clockB);
    box(-0.1, 0.1, 0.05, 3.2, -0.1, 0.1, M("#4a4f5a"), true, clockB); box(-1.7, 1.7, 3.2, 5.0, -0.12, 0.12, M("#241726"), true, clockB);
    const cs = scrMesh(this.clock, 3.2, 1.6); cs.position.set(0, 4.1, -0.125); cs.rotation.y = Math.PI; clockB.add(cs);
    const qT = cv(256, 256, (g) => { g.fillStyle = "#241726"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#ffd21f"; g.fillRect(10, 10, 236, 236); txt(g, "?", 128, 210, 220, "#241726", "center"); });
    this.q = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 0.2), [M("#241726"), M("#241726"), M("#241726"), M("#241726"), M("#ffffff", qT), M("#ffffff", qT)]); this.q.position.set(L0.drum[0], 6.2, L0.drum[2] + 1.0); this.q.castShadow = true; R.add(this.q);
    const monT = cv(128, 96, (g) => { g.fillStyle = "#14223a"; g.fillRect(0, 0, 128, 96); g.fillStyle = "#7ddf8a"; for (let i = 0; i < 6; i++) g.fillRect(8, 8 + i * 13, 30 + ((i * 37) % 80), 6); txt(g, "?", 104, 80, 50, "#ffd21f", "center"); });
    for (const [tx, tz] of L0.tables) {
      box(tx - 0.8, tx + 0.8, 0.75, 0.8, tz - 0.4, tz + 0.4, M("#f4efe6")); for (const sx of [-0.7, 0.7]) box(tx + sx - 0.03, tx + sx + 0.03, 0.05, 0.75, tz - 0.03, tz + 0.03, M("#7a5230"));
      box(tx - 0.28, tx + 0.28, 0.8, 1.25, tz - 0.3, tz - 0.12, M("#e7e0cc")); const ms = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.36), new THREE.MeshBasicMaterial({ map: monT, toneMapped: false, color: new THREE.Color(0.9, 0.9, 0.9) })); ms.position.set(tx, 1.03, tz - 0.114); ms.layers.set(NOINK); R.add(ms);
    }
    const stool = (x: number, z: number) => box(x - 0.22, x + 0.22, 0.08, 0.45, z - 0.2, z + 0.2, M("#4a4f5a"));
    for (const [tx, tz] of L0.tables) stool(tx, tz + 0.66); stool(L0.cpu[0], L0.cpu[2] + 0.66);
    const placard = (x: number, z: number, s: string, col: string) => { const p = sign(1.0, 0.45, (g, W, Hh) => { g.fillStyle = col; g.fillRect(0, 0, W, Hh); g.strokeStyle = "#241726"; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, Hh - 8); txt(g, s, W / 2, Hh * 0.74, Hh * 0.62, "#241726", "center"); }, 256); p.position.set(x, 1.15, z); p.rotation.y = Math.PI; R.add(p); box(x - 0.03, x + 0.03, 0.05, 0.95, z + 0.02, z + 0.06, M("#7a5230")); };
    box(L0.cpu[0] - 0.8, L0.cpu[0] + 0.8, 0.75, 0.8, L0.cpu[2] - 0.45, L0.cpu[2] + 0.45, M("#a8743e")); for (const sx of [-0.7, 0.7]) box(L0.cpu[0] + sx - 0.03, L0.cpu[0] + sx + 0.03, 0.05, 0.75, L0.cpu[2] - 0.03, L0.cpu[2] + 0.03, M("#7a5230"));
    for (let k = 0; k < 5; k++) { const pp = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.004, 0.29), M("#fbfbf4")); pp.position.set(L0.cpu[0] - 0.3 + 0.12 * k, 0.802 + 0.005 * k, L0.cpu[2]); pp.rotation.y = 0.3 * Math.sin(k * 2); R.add(pp); }
    placard(L0.cpu[0] + 0.9, L0.cpu[2] - 0.7, "CPU", "#2f9be0"); placard(L0.gpu[0] - 3.6, L0.gpu[2] - 4.6, "GPU", "#3fbf6a");
    for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 20), M("#ffc93a")); c.position.set(L0.drum[0] + 2.2 + 0.03 * k, 0.09 + k * 0.081, L0.drum[2] - 1.2); c.castShadow = true; R.add(c); this.prize.push(c); }
    // ---------- chart square (south, x 115..248, z -70..-12) ----------
    box(115, 248, -0.1, 0.08, -70, -8, M("#d9d2c4", cv(256, 256, (g) => { g.fillStyle = "#d9d2c4"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#c4bba9"; g.lineWidth = 3; for (let i = 0; i <= 256; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); } })), false);
    const shp = new THREE.Shape(); shp.moveTo(CH.x0, 0.05);
    for (let x = CH.x0; x <= CH.x1 + 0.001; x += 0.25) shp.lineTo(x, chartH(x)); shp.lineTo(CH.x1, 0.05); shp.closePath();
    const stripeT = cv(64, 64, (g) => { g.fillStyle = "#2f9be0"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#3aa8ec"; g.fillRect(0, 0, 64, 6); g.fillStyle = "#2a8ccf"; g.fillRect(0, 32, 64, 2); });
    stripeT.wrapS = stripeT.wrapT = THREE.RepeatWrapping; stripeT.repeat.set(0.25, 0.25);
    const eg = new THREE.ExtrudeGeometry(shp, { depth: 1.2, bevelEnabled: false, steps: 1 }); eg.translate(0, 0, CH.z - 0.6);
    const rib = new THREE.Mesh(eg, M("#ffffff", stripeT)); rib.castShadow = rib.receiveShadow = true; R.add(rib);
    const pts: THREE.Vector3[] = []; for (let x = CH.x0; x <= CH.x1 + 0.001; x += 0.5) pts.push(new THREE.Vector3(x, chartH(x) + 0.12, CH.z));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 900, 0.2, 8), M("#ffd21f")); tube.castShadow = true; R.add(tube);
    for (let y = 2011; y <= 2025; y++) {
      const x = yr2x(y), pl = sign(1.1, 0.5, (g, W, Hh) => { g.fillStyle = "#fffbe8"; g.fillRect(0, 0, W, Hh); g.strokeStyle = "#241726"; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, Hh - 6); txt(g, String(y), W / 2, Hh * 0.74, Hh * 0.6, "#241726", "center"); }, 256);
      pl.position.set(x, 0.75, CH.z + 2.4); R.add(pl); box(x - 0.03, x + 0.03, 0.05, 0.5, CH.z + 2.35, CH.z + 2.38, M("#7a5230"));
    }
    this.rider = new THREE.Group(); R.add(this.rider);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.16, 32), [M("#d99a1a"), M("#ffc93a"), M("#d99a1a")]); disc.castShadow = true; this.rider.add(disc);
    this.exch = new THREE.Group(); this.exch.position.set(yr2x(2014.15), 0, CH.z + 10); R.add(this.exch);
    box(-3, 3, 0, 6, -2.5, 2.5, M("#cfd6e0"), true, this.exch); box(-3.2, 3.2, 6, 6.4, -2.7, 2.7, M("#8a8f9a"), true, this.exch);
    const ex = sign(4.6, 0.8, (g, W, Hh) => { g.fillStyle = "#241726"; g.fillRect(0, 0, W, Hh); txt(g, "EXCHANGE", W / 2, Hh * 0.72, Hh * 0.6, "#ffd21f", "center"); }, 512); ex.position.set(0, 5.2, 2.52); this.exch.add(ex);
    for (let k = 0; k < 3; k++) box(-2.4 + k * 1.8, -1.4 + k * 1.8, 1.2, 4.4, 2.5, 2.54, M("#9fd4ef"), false, this.exch);
    this.vault = new THREE.Group(); this.vault.position.set(yr2x(2025.3) + 6, 2.6, CH.z + 7); R.add(this.vault);
    const vc = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.5, 40).rotateX(Math.PI / 2), [M("#d99a1a"), M("#ffffff", cv(256, 256, (g) => coinGlyph(g, 128, 128, 120, false))), M("#ffffff", cv(256, 256, (g) => coinGlyph(g, 128, 128, 120, false)))]); vc.castShadow = true; this.vault.add(vc);
    box(-0.8, 0.8, -2.6, -2.5, -0.6, 0.6, M("#8a8f9a"), true, this.vault);
    const qq = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: cv(256, 256, (g) => { g.clearRect(0, 0, 256, 256); g.fillStyle = "#241726"; g.font = "900 230px Mont, sans-serif"; g.textAlign = "center"; g.fillText("?", 128, 222); g.fillStyle = "#ffd21f"; g.font = "900 200px Mont, sans-serif"; g.fillText("?", 128, 212); }), transparent: true, alphaTest: 0.4, fog: false, side: THREE.DoubleSide }));
    qq.position.set(CH.x1 + 7, 30, CH.z); qq.layers.set(NOINK); R.add(qq);
    // ---------- hall-of-fame stage (back of the 2025 plaza) ----------
    box(-58, -42, 0.08, 1.0, -25.6, -21.6, M("#3a3d6a")); box(-58.2, -41.8, 1.0, 1.04, -25.8, -21.4, M("#ffd21f"), false);
    box(-58, -42, 1.0, 6.2, -26.0, -25.7, M("#241726"));
    const hof = sign(12, 2.0, (g, W, Hh) => { g.fillStyle = "#241726"; g.fillRect(0, 0, W, Hh); g.strokeStyle = "#ffd21f"; g.lineWidth = 8; g.strokeRect(8, 8, W - 16, Hh - 16); txt(g, "BITCOIN HALL OF FAME", W / 2, Hh * 0.66, Hh * 0.46, "#ffd21f", "center"); for (const x of [40, W - 40]) { g.fillStyle = "#ffd21f"; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 22; g.lineTo(x + r * Math.cos(a), Hh / 2 + r * Math.sin(a)); } g.fill(); } }, 1024);
    hof.position.set(-50, 4.9, -25.68); R.add(hof);
    box(-46.6, -45.6, 1.04, 2.1, -23.6, -22.9, M("#a8743e"));
    this.trophyStand = new THREE.Group(); this.trophyStand.position.set(-46.1, 2.1, -23.25); R.add(this.trophyStand);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.3, 20), M("#ffc93a")); cup.position.y = 0.27; this.trophyStand.add(cup); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 16), M("#7a4b2a")); st.position.y = 0.06; this.trophyStand.add(st);
    // ---------- cinema (north side x -100..-88) ----------
    box(-101, -87, 0, 11, 12, 24, M("#7a2f3a")); box(-101.4, -86.6, 6.0, 7.6, 10.6, 12.0, M("#ffd21f"));
    const marq = sign(14, 1.5, (g, W, Hh) => { g.fillStyle = "#fffbe8"; g.fillRect(0, 0, W, Hh); for (let i = 0; i < 40; i++) { g.fillStyle = "#ffd21f"; g.beginPath(); g.arc(12 + i * (W - 24) / 39, 8, 5, 0, 7); g.fill(); } txt(g, "NEXT EPISODE", W / 2, Hh * 0.75, Hh * 0.5, "#c8363a", "center"); }, 1024);
    marq.position.set(-94, 6.8, 10.58); marq.rotation.y = Math.PI; R.add(marq);
    const posterE = sign(3.2, 4.4, (g, W, Hh) => {
      g.fillStyle = "#241726"; g.fillRect(0, 0, W, Hh); const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, "#f7b2a0"); gr.addColorStop(1, "#7b5ac9"); g.fillStyle = gr; g.fillRect(10, 10, W - 20, Hh - 20);
      g.strokeStyle = "#241726"; g.lineWidth = 5; const cx = W * 0.6, top = 40, base = Hh - 70; g.beginPath(); g.moveTo(cx, top); g.lineTo(cx - 70, base); g.moveTo(cx, top); g.lineTo(cx + 70, base); for (let i = 1; i < 8; i++) { const y = top + (base - top) * i / 8, hw = 70 * i / 8; g.moveTo(cx - hw, y); g.lineTo(cx + hw, y); g.moveTo(cx - hw, y); g.lineTo(cx + hw * 0.7, y + (base - top) / 8); } g.stroke();
      g.fillStyle = "#241726"; g.beginPath(); g.arc(cx, base, 40, Math.PI, 0); g.fill();
      g.fillStyle = "#2a2a33"; g.fillRect(40, Hh - 210, 70, 120); g.fillRect(48, Hh - 260, 54, 44); g.fillRect(36, Hh - 222, 78, 10); g.fillStyle = "#f5c9a0"; g.beginPath(); g.arc(75, Hh - 190, 26, 0, 7); g.fill();
      txt(g, "SOLD!", W * 0.5, Hh - 26, 40, "#ffd21f", "center");
    }, 256);
    posterE.position.set(-90.8, 3.2, 11.95); posterE.rotation.y = Math.PI; R.add(posterE);
    const posterB = sign(3.2, 4.4, (g, W, Hh) => { g.fillStyle = "#241726"; g.fillRect(0, 0, W, Hh); g.fillStyle = "#3a7fdc"; g.fillRect(10, 10, W - 20, Hh - 20); pizzaTop(new Pen(g), W / 2, Hh * 0.42, 80); txt(g, "OOPSONOMICS", W / 2, Hh - 40, 30, "#ffd21f", "center"); }, 256);
    posterB.position.set(-97.2, 3.2, 11.95); posterB.rotation.y = Math.PI; R.add(posterB);
    box(-95.2, -92.8, 0, 2.6, 11.9, 12.0, M("#241726"), false);
    // ---------- traffic (main road lanes), shown only in shots that allow it ----------
    const CC = ["#2f9be0", "#ffd21f", "#3fbf6a", "#f4efe6", "#7b5ac9", "#e8402f"];
    for (let k = 0; k < 6; k++) {
      const g = new THREE.Group(); R.add(g); this.traffic.push(g);
      box(-2.1, 2.1, 0.35, 1.15, -0.9, 0.9, M(CC[k]), true, g); box(-1.2, 1.1, 1.15, 1.75, -0.82, 0.82, M("#bfe4f7"), true, g);
      for (const [a, b] of [[-1.3, -0.85], [1.3, -0.85], [-1.3, 0.85], [1.3, 0.85]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16).rotateX(Math.PI / 2), M("#2a2a33")); w.position.set(a, 0.36, b); g.add(w); }
    }
  }

  update(t: number, s: Shot) {
    const id = s.id;
    for (const k of Object.keys(this.shells)) for (const o of this.shells[k]) o.visible = s.inside !== k;
    // GPU rig: on the desk from the install (84 s) on; fans spin
    this.gpuRig.visible = t > 84.2; for (const fn of this.gpuFans) fn.rotation.x = t * 14;
    // office coin pile (120.7 .. 124.5 grows; stays later)
    const nc = t < 120.7 ? 0 : Math.floor(40 * clamp01((t - 121.0) / 3.0));
    for (const c of this.officeCoins) { const k = c.userData.k; c.visible = k < nc; }
    // office box stack (316..) grows with the repeat orders
    const nb = t < 316 ? 0 : Math.min(12, 2 + Math.floor((t - 316) / 1.3));
    this.officeBoxes.forEach((b, k) => (b.visible = k < nb));
    // toppings on the topping words
    const TW = [169.68, 170.52, 171.12, 171.82, 172.34];
    this.dough.visible = t > 166 && t < 182; this.tops.forEach((arr, k) => arr.forEach((m, i) => { const u = easeOut((t - TW[k] - i * 0.04) / 0.18); m.visible = u > 0; m.scale.setScalar(Math.max(0.01, u)); }));
    // lottery drum spin, prize coins pop on the win (99.1), clock countdown
    this.drum.rotation.z = t * 1.4;
    this.prize.forEach((c, k) => { const u = easeOut((t - 99.4 - k * 0.07) / 0.25); c.visible = t > 99.4 && t < 140; c.scale.set(1, Math.max(0.01, u), 1); });
    if (!this.clock.key) { this.clock.key = "x"; const g = this.clock.c.getContext("2d")!; g.fillStyle = "#14223a"; g.fillRect(0, 0, 256, 128); txt(g, "10 MIN", 128, 74, 60, "#ffd21f", "center"); this.clock.tex.needsUpdate = true; }
    { const g = this.clock.c.getContext("2d")!, k = (t * 0.1) % 1; g.fillStyle = "#24365a"; g.fillRect(20, 92, 216, 20); g.fillStyle = "#3fbf6a"; g.fillRect(20, 92, 216 * k, 20); this.clock.tex.needsUpdate = true; }
    this.q.rotation.y = 0.15 * Math.sin(t * 0.8);
    // chart rider follows the shot's year track
    const ry = riderYear(t);
    this.rider.visible = ry !== null;
    if (ry !== null) { const x = yr2x(ry); this.rider.position.set(x, chartH(x) + 0.42, CH.z); }
    // exchange collapse (424.9 .. 428.6)
    { const u = smooth((t - 425.1) / 1.6); this.exch.rotation.z = -0.35 * u; this.exch.position.y = -2.2 * u; this.exch.visible = u < 0.999; }
    // SOLD signs (361.2 shop, 362.6 street) + deals banner (pizza day 2025 only)
    this.soldShop.visible = t > 361.5 && t < 365; this.soldStreet.forEach((o, k) => { const u = easeOut((t - 362.7 - k * 0.08) / 0.2); o.visible = t > 362.7 && t < 365; o.scale.set(1, Math.max(0.01, u), 1); });
    this.dealsBanner.visible = t > 551 && t < 561.2;
    this.trophyStand.visible = t > 556 && t < 568.2;
    // traffic: lanes z +-2, deterministic loop
    this.traffic.forEach((g, k) => { const dir = k % 2 ? 1 : -1, v = 9 + k, span = 320, x0 = -150 + rnd(k) * span; const x = -150 + ((((x0 - 150 + dir * v * t) % span) + span) % span); g.position.set(x, 0.02, dir * 1.2); g.rotation.y = dir > 0 ? 0 : Math.PI; g.visible = s.traffic === 1 || (s.traffic === 2 && dir > 0); });
  }
  drawLaptop(t: number, mode: string) {
    const S = this.laptop, key = mode + Math.floor(t * 10); if (key === S.key) return; S.key = key;
    const g = S.c.getContext("2d")!, W = 512, Hh = 384;
    g.fillStyle = "#eef2f7"; g.fillRect(0, 0, W, Hh); g.fillStyle = "#3a7fdc"; g.fillRect(0, 0, W, 50);
    if (mode === "card") { txt(g, "ORDER: 2 LARGE PIZZAS", 20, 34, 24, "#ffffff"); g.fillStyle = "#3f7fd0"; g.fillRect(120, 110, 270, 170); g.fillStyle = "#241726"; g.fillRect(120, 140, 270, 30); g.fillStyle = "#ffd21f"; g.fillRect(140, 200, 50, 36); txt(g, "PAY", 256, 340, 36, "#3fbf6a", "center"); }
    else if (mode === "coins") { txt(g, "WALLET", 20, 34, 26, "#ffffff"); const k = clamp01((t - 242.0) / 2.0); coinGlyph(g, 256, 180, 50 + 30 * k); txt(g, "+ 10,000 BTC", 256, 320, 44, "#3fbf6a", "center"); }
    else { txt(g, "FORUM", 20, 34, 26, "#ffffff"); for (let r = 0; r < 7; r++) { g.fillStyle = r % 2 ? "#dde5ef" : "#ffffff"; g.fillRect(10, 64 + r * 44, W - 20, 38); g.fillStyle = "#5a6a80"; g.fillRect(30, 78 + r * 44, 120 + ((r * 53) % 160), 9); } }
    S.tex.needsUpdate = true;
  }
}
