// One sunny Jacksonville town in three.js: road along x, 2025 celebration plaza (x -66..-34), 2010 sidewalk stand
// (x ~20), Laszlo's house (x 67..81, office + CRT inside), Papa-style pizza shop (x 40). Procedural props only.
// World materials: Lambert + twoTone (shade.ts); cast = Canvas2D cards (oops/cast.ts drawChar) with cardShade.
import * as THREE from "three";
import { TONE, CHAR, untone } from "../molasses/shade";
import { LIGHTS } from "../molasses/lights";
import { cardShade, blobMaterial } from "../molasses/cardshade";
import { facadeHD, roofHD } from "../molasses/paint";
import { NOINK } from "../molasses/ink";
import { coinGlyph, pizzaTop, pizzaBox, extra } from "../oops/cast";
import { Pen } from "../molasses/toon";
import { drawChar3, View } from "./char3d";
import { camAt, cast, shotAt, HOUSE, CRT, STAND, PEDESTAL, DOOR_X, smooth, clamp01, easeOut, V3, groundY, speakerAt, talkAt, SHOTS, Shot, LOT } from "./story3d";
import { M, flat, cv, rnd, mkBox, txt } from "./util3d";
import { Sets } from "./sets3d";
import { buildTown } from "./town";

const L = LIGHTS.day;
const SUN_DIR = new THREE.Vector3(0.45, 0.8, 0.4).normalize(); // one sun for the whole town
export class World3D {
  root = new THREE.Group();
  sun = new THREE.DirectionalLight("#fff3e0", 2.8);
  hemi = new THREE.HemisphereLight("#dcecff", "#b49a78", 0.55);
  fog = new THREE.Fog("#b8d0ec", 40, 420);
  cards: { mesh: THREE.Mesh; blob: THREE.Mesh; c: HTMLCanvasElement; tex: THREE.CanvasTexture; key: string }[] = [];
  door!: THREE.Object3D; coins: THREE.Object3D[] = []; boxes: THREE.Object3D[] = []; fancyX!: THREE.Mesh; screen!: { c: HTMLCanvasElement; tex: THREE.CanvasTexture; key: string };
  tag!: THREE.Mesh; coin3!: THREE.Object3D; candle!: THREE.Mesh; balloons: THREE.Object3D[] = []; confetti!: THREE.InstancedMesh;
  houseShell: THREE.Object3D[] = []; lastShot = ""; sets!: Sets; workers: THREE.InstancedMesh[] = []; shadowC = new Map<string, THREE.Vector3>();
  constructor() {
    const R = this.root;
    R.add(this.sun, this.sun.target, this.hemi);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    // sky dome (gradient) + clouds, NOINK
    const top = untone("#3a7fdc"), hor = untone("#bcd8f2");
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: top }, hor: { value: hor } },
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float e = clamp(normalize(vP).y, 0.0, 1.0); gl_FragColor = vec4(mix(hor, top, pow(smoothstep(0.0, 0.55, e), 0.7)), 1.0); }" }));
    sky.layers.set(NOINK); sky.renderOrder = -10; sky.frustumCulled = false; R.add(sky); (this as any).sky = sky;
    const cloudT = cv(512, 256, (g) => { g.fillStyle = "#ffffff"; for (const [x, y, r] of [[130, 170, 70], [220, 130, 95], [330, 150, 80], [410, 180, 55], [260, 190, 70]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.fillStyle = "rgba(200,214,240,0.9)"; g.fillRect(60, 205, 400, 40); g.clearRect(0, 225, 512, 40); });
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4, d = 520 + 160 * rnd(i), m = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshBasicMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false, color: new THREE.Color(1.15, 1.15, 1.15) }));
      m.position.set(Math.cos(a) * d, 70 + 70 * rnd(i + 3), Math.sin(a) * d); m.lookAt(0, m.position.y, 0); m.layers.set(NOINK); m.renderOrder = -9; R.add(m);
    }
    // ground: grass, road, sidewalks, plaza
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400).rotateX(-Math.PI / 2), M("#cfc8b8")); ground.position.y = -0.15; ground.receiveShadow = true; R.add(ground);
    const box = mkBox(R) as any;
    const lawnT = cv(128, 128, (g) => { g.fillStyle = "#7cc25a"; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 300; i++) { g.fillStyle = i % 2 ? "#86ca62" : "#72b852"; g.fillRect(rnd(i) * 128, rnd(i + 0.5) * 128, 2, 5); } });
    lawnT.wrapS = lawnT.wrapT = THREE.RepeatWrapping; lawnT.repeat.set(200, 5);
    for (const sd of [-1, 1]) box(-800, 800, -0.15, 0.0, sd > 0 ? 7 : -26, sd > 0 ? 26 : -7, M("#ffffff", lawnT), false);
    (this as any).box = box;
    box(-800, 800, -0.15, 0.02, -4, 4, M("#55585f"), false);
    for (let x = -796; x < 800; x += 6) box(x, x + 3, 0.02, 0.08, -0.09, 0.09, M("#f5f1e4"), false);
    for (const s of [-1, 1]) { box(-800, 800, -0.15, 0.15, s > 0 ? 4 : -7, s > 0 ? 7 : -4, M("#d9d2c4"), false); box(-800, 800, 0.15, 0.2, s > 0 ? 4 : -4.12, s > 0 ? 4.12 : -4, M("#bfb6a6"), false); }
    // cross street at x = 0 and x = 45 (just paint stripes on the road would z-fight; use darker inset blocks)
    // plaza 2025
    box(-66, -34, -0.1, 0.08, -26, -7.05, M("#e8d7b8"), false);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) box(-66 + i * 4, -62 + i * 4, 0.08, 0.09, -26 + j * 4.7, -21.3 + j * 4.7, M("#d7c09a"), false);
    // pedestal with the "fancy" pizza (gold cloche plate)
    box(PEDESTAL[0] - 0.55, PEDESTAL[0] + 0.55, 0.08, 1.0, PEDESTAL[2] - 0.55, PEDESTAL[2] + 0.55, M("#f4efe6"));
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.04, 40), M("#ffd75a")); plate.position.set(PEDESTAL[0], 1.02, PEDESTAL[2]); plate.castShadow = true; R.add(plate);
    const pz = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 40), [M("#e0a24a"), M("#f2c14e", cv(256, 256, (g) => { const p = new Pen(g); pizzaTop(p, 128, 128, 120); g.fillStyle = "#1a1a22"; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(128 + 70 * Math.cos(i * 2.4) * Math.sqrt(i / 26), 128 + 70 * Math.sin(i * 2.4) * Math.sqrt(i / 26), 5, 0, 7); g.fill(); } g.fillStyle = "#ffd21f"; g.fillRect(118, 60, 20, 20); })), M("#e0a24a")]);
    pz.position.set(PEDESTAL[0], 1.065, PEDESTAL[2]); pz.castShadow = true; R.add(pz);
    const xT = cv(256, 256, (g) => { g.lineCap = "round"; for (const [w, c] of [[64, "#241726"], [42, "#e8402f"]] as const) { g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.moveTo(40, 40); g.lineTo(216, 216); g.moveTo(216, 40); g.lineTo(40, 216); g.stroke(); } });
    this.fancyX = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: xT, alphaTest: 0.5, fog: false, side: THREE.DoubleSide }));
    this.fancyX.layers.set(NOINK); R.add(this.fancyX);
    // bunting + balloons + big "party" poles
    const flagT = cv(64, 64, (g) => { g.fillStyle = "#fff"; g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 0); g.lineTo(32, 60); g.fill(); });
    const FC = ["#e8402f", "#ffd21f", "#2f9be0", "#3fbf6a", "#f07ad0"];
    for (let k = 0; k < 2; k++) {
      const z = -16 - k * 6;
      for (const x of [-60, -40]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 6, 10), M("#f4efe6")); pole.position.set(x + (k ? 2 : 0), 3, z); pole.castShadow = true; R.add(pole); }
      for (let i = 0; i < 26; i++) { const u = i / 25, x = -60 + (k ? 2 : 0) + u * 20, y = 5.8 - 1.4 * Math.sin(u * Math.PI);
        const f = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshLambertMaterial({ color: FC[i % 5], map: flagT, alphaTest: 0.5, side: THREE.DoubleSide })); f.position.set(x, y - 0.3, z); f.layers.set(NOINK); R.add(f); }
    }
    for (let i = 0; i < 14; i++) {
      const b = new THREE.Group(), s = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), M(FC[i % 5])); s.scale.y = 1.18; s.castShadow = true; b.add(s);
      const str = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 2.2, 4), M("#ffffff")); str.position.y = -1.5; b.add(str);
      b.userData = { x: -62 + rnd(i) * 26, z: -10.5 - rnd(i + 9) * 14, y: 3.4 + rnd(i + 4) * 2.2, p: rnd(i + 2) * 6 }; this.balloons.push(b); R.add(b);
    }
    // confetti (instanced quads, falls in the hook)
    this.confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, fog: false }), 260);
    for (let i = 0; i < 260; i++) this.confetti.setColorAt(i, new THREE.Color(FC[i % 5]));
    this.confetti.layers.set(NOINK); this.confetti.frustumCulled = false; R.add(this.confetti);
    // street houses both sides (front facades painted)
    const WALLS = ["#f2dcae", "#cfe6f2", "#f6c9b8", "#e2efc7", "#fbe7a1", "#d9cdf2"], SH = ["#4f86b8", "#3f9a6a", "#c0503a", "#7a5ac9"];
    const ROOFS = ["#c0503a", "#4a6a9a", "#8a5a3a", "#3f7a5a"];
    const lot = (x: number, side: number, w: number, d: number, h: number, i: number) => {
      const z0 = side > 0 ? 12 : -12 - d, z1 = side > 0 ? 12 + d : -12;
      const wall = WALLS[i % 6], fac = facadeHD("o3d" + (i % 6) + "_" + w + "_" + h, w, h, { wall, shutter: SH[i % 4], door: true, brick: i % 5 === 4 });
      const g = new THREE.BoxGeometry(w, h, d); g.translate(x, h / 2, (z0 + z1) / 2);
      const side0 = M(wall), front = M("#ffffff", fac);
      const mesh = new THREE.Mesh(g, side > 0 ? [side0, side0, side0, side0, side0, front] : [side0, side0, side0, side0, front, side0]);
      if (side > 0) { mesh.geometry = g; } mesh.castShadow = mesh.receiveShadow = true; R.add(mesh);
      // pitched roof
      const rg = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1); rg.rotateY(Math.PI / 4); rg.scale(w * 0.78, h * 0.42, d * 0.78); rg.translate(x, h + h * 0.21, (z0 + z1) / 2);
      const roof = new THREE.Mesh(rg, M(ROOFS[i % 4], roofHD(ROOFS[i % 4]))); roof.castShadow = roof.receiveShadow = true; R.add(roof);
    };
    let i = 0;
    for (const side of [-1, 1]) for (let x = -140; x < 160; x += 15 + 4 * rnd(x)) {
      if (side < 0 && ((x > -70 && x < -30) || (x > 60 && x < 86) || (x > 30 && x < 52) || (x > 4 && x < 30) || (x > 104 && x < 250))) continue;
      if (side > 0 && ((x > -112 && x < -84) || (x > -38 && x < 18) || (x > 88 && x < 113))) continue;
      lot(x, side, 9 + Math.round(rnd(x + side) * 3), 9, 6 + Math.round(rnd(x * 2) * 3), i++);
    }
    // trees and palms, hydrants, lamps, cars
    const tree = (x: number, z: number, s: number) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.22 * s, 2.4 * s, 8), M("#8a5a34")); t.position.set(x, 1.2 * s, z); t.castShadow = true; R.add(t);
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 * s, 1), M("#4fae4a")); c.position.set(x, 3.2 * s, z); c.castShadow = true; R.add(c);
    };
    const palm = (x: number, z: number, s: number) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.24 * s, 6 * s, 8), M("#a8875a")); t.position.set(x, 3 * s, z); t.rotation.z = 0.06; t.castShadow = true; R.add(t);
      for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.4 * s, 3 * s, 4), M("#3f9a4a")); l.position.set(x + Math.cos(k * 0.9) * 1.2 * s - 0.2, 6 * s, z + Math.sin(k * 0.9) * 1.2 * s); l.rotation.set(Math.sin(k * 0.9) * 1.6, 0, -Math.cos(k * 0.9) * 1.6); l.scale.z = 0.25; l.castShadow = true; R.add(l); }
    };
    for (let x = -130; x < 150; x += 17) { if (Math.abs(x + 50) < 14 || Math.abs(x - 20) < 6 || Math.abs(x - 72) < 7 || (x > 2 && x < 30) || (x > 105)) continue; palm(x + 3, -8.6, 1); if (!(x > -36 && x < 16) && !(x > -112 && x < -84)) palm(x + 11, 9.2, 1.05); }
    for (const [x, z] of [[-64, -24], [-36, -24], [-64, -12], [66, -16], [84, -20], [83, -12]]) tree(x, z, 1.1);
    const car = (x: number, z: number, col: string, yaw = 0) => {
      const g = new THREE.Group(); g.position.set(x, 0.02, z); g.rotation.y = yaw; R.add(g);
      box(-2.1, 2.1, 0.35, 1.15, -0.9, 0.9, M(col), true, g); box(-1.2, 1.1, 1.15, 1.75, -0.82, 0.82, M("#bfe4f7"), true, g);
      for (const [a, b] of [[-1.3, -0.85], [1.3, -0.85], [-1.3, 0.85], [1.3, 0.85]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16).rotateX(Math.PI / 2), M("#2a2a33")); w.position.set(a, 0.36, b); g.add(w); }
    };
    car(56, -3.05, "#e8402f"); car(30, 3.05, "#2f9be0"); car(-24, -3.05, "#ffd21f"); car(120, 3.05, "#3fbf6a");
    for (let x = -120; x < 150; x += 24) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), M("#4a4f5a")); p.position.set(x, 2.35, 6.4); p.castShadow = true; R.add(p); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.3), M("#4a4f5a")); hd.position.set(x, 4.55, 6.0); R.add(hd); }
    // ---------- Laszlo's house (shell = walls/roof; hidden for inside shots, inside stays) ----------
    const H = HOUSE, sh = (o: THREE.Object3D) => { this.houseShell.push(o); return o; };
    box(H.x0, H.x1, 0, H.floor, H.z0, H.z1, M("#c9a57a", cv(256, 256, (g) => { g.fillStyle = "#c9a57a"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#a9855a"; g.lineWidth = 3; for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } })), false);
    box(72, 76, 0, 0.25, -11, -9.6, M("#e8e2d6"), false); // porch slab
    const extW = M("#f7e3b3"), intW = M("#bfe0d2"), T = 0.2;
    const wallX = (x: number, z0: number, z1: number) => box(x - T / 2, x + T / 2, H.floor, H.floor + H.h, z0, z1, extW);
    wallX(H.x0, H.z0, H.z1); wallX(H.x1, H.z0, H.z1);
    { const wy0 = H.floor + 1.0, wy1 = H.floor + 2.4, wx0 = 69.4, wx1 = 72.4; // back wall with a window onto the street behind
      box(H.x0, wx0, H.floor, H.floor + H.h, H.z0 - T, H.z0, extW); box(wx1, H.x1, H.floor, H.floor + H.h, H.z0 - T, H.z0, extW);
      box(wx0, wx1, H.floor, wy0, H.z0 - T, H.z0, extW); box(wx0, wx1, wy1, H.floor + H.h, H.z0 - T, H.z0, extW);
      box(wx0 - 0.08, wx1 + 0.08, wy0 - 0.08, wy0, H.z0 - T - 0.02, H.z0 + 0.12, M("#ffffff"), false); box(wx0 + 1.46, wx0 + 1.54, wy0, wy1, H.z0 - T / 2 - 0.02, H.z0 - T / 2 + 0.02, M("#ffffff"), false);
      (this as any).win = [wx0, wx1, wy0, wy1]; }
    // front wall with door gap (DOOR_X +-0.6) and two window holes covered by glass blocks
    const zf0 = H.z1 - T, zf1 = H.z1;
    sh(box(H.x0, DOOR_X - 0.6, H.floor, H.floor + H.h, zf0, zf1, extW)); sh(box(DOOR_X + 0.6, H.x1, H.floor, H.floor + H.h, zf0, zf1, extW)); sh(box(DOOR_X - 0.6, DOOR_X + 0.6, H.floor + 2.3, H.floor + H.h, zf0, zf1, extW));
    for (const wx of [69.5, 78.5]) { sh(box(wx - 1, wx + 1, H.floor + 1.1, H.floor + 2.3, zf1, zf1 + 0.06, M("#9fd4ef"), false)); sh(box(wx - 1.15, wx + 1.15, H.floor + 1.0, H.floor + 1.1, zf1, zf1 + 0.18, M("#ffffff"), false)); }
    // interior wall skins (slightly inside) for a lit room colour
    { const [wx0, wx1, wy0, wy1] = (this as any).win; box(H.x0 + T / 2, wx0, H.floor, H.floor + H.h - 0.01, H.z0, H.z0 + 0.02, intW, false); box(wx1, H.x1 - T / 2, H.floor, H.floor + H.h - 0.01, H.z0, H.z0 + 0.02, intW, false);
      box(wx0, wx1, H.floor, wy0, H.z0, H.z0 + 0.02, intW, false); box(wx0, wx1, wy1, H.floor + H.h - 0.01, H.z0, H.z0 + 0.02, intW, false); }
    box(H.x1 - T / 2 - 0.02, H.x1 - T / 2, H.floor, H.floor + H.h - 0.01, H.z0 + 0.02, H.z1 - T, intW, false);
    box(H.x0, H.x1, H.floor + H.h, H.floor + H.h + 0.05, H.z0 - T, H.z1, M("#f4efe6"), false); // ceiling (no shadow: sunlit toon room)
    // roof (pitched) + ceiling-less (sun lights the room through the hidden roof in inside shots: bright toon room)
    { const rg = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1); rg.rotateY(Math.PI / 4); rg.scale((H.x1 - H.x0) * 0.8, 2.6, (H.z1 - H.z0) * 0.85); rg.translate((H.x0 + H.x1) / 2, H.floor + H.h + 1.3, (H.z0 + H.z1) / 2); const r = new THREE.Mesh(rg, M("#4a6a9a", roofHD("#4a6a9a"))); r.castShadow = true; R.add(r); sh(r); }
    // door (hinged at DOOR_X - 0.6)
    this.door = new THREE.Group(); this.door.position.set(DOOR_X - 0.6, H.floor, H.z1 - 0.02); R.add(this.door);
    box(0.02, 1.18, 0, 2.28, -0.06, 0.04, M("#c0503a"), true, this.door);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M("#ffd75a")); knob.position.set(1.0, 1.1, 0.08); this.door.add(knob);
    // mailbox + lawn path
    box(DOOR_X - 0.6, DOOR_X + 0.6, 0, 0.12, -9.6, -7, M("#e8e2d6"), false);
    box(66.2, 66.4, 0, 1.1, -7.6, -7.4, M("#6a5a4a")); box(65.95, 66.65, 1.1, 1.5, -7.75, -7.25, M("#2f6fb5"));
    // office: desk, CRT, keyboard, chair, posters, shelf
    const f = H.floor, [cx, cy, cz] = CRT.pos;
    box(77.25, 80.5, f + 0.72, f + 0.78, -20.85, -19.75, M("#a8743e")); for (const [a, b] of [[77.35, -20.75], [80.4, -20.75], [77.35, -19.85], [80.4, -19.85]]) box(a - 0.04, a + 0.04, f, f + 0.72, b - 0.04, b + 0.04, M("#7a5230"));
    const crt = new THREE.Group(); crt.position.set(cx, cy, cz); crt.rotation.y = CRT.yaw; R.add(crt);
    box(-0.3, 0.3, 0, 0.52, -0.3, 0.22, M("#e7e0cc"), true, crt); box(-0.2, 0.2, 0.05, 0.45, -0.52, -0.3, M("#d6cfba"), true, crt); box(-0.18, 0.18, -0.02, 0, -0.18, 0.18, M("#d6cfba"), true, crt);
    this.screen = (() => { const c = document.createElement("canvas"); c.width = 512; c.height = 384; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return { c, tex, key: "" }; })();
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.375), new THREE.MeshBasicMaterial({ map: this.screen.tex, fog: false, toneMapped: false, color: new THREE.Color(0.9, 0.9, 0.9) }));
    scr.position.set(0, 0.26, 0.232); crt.add(scr); scr.layers.set(NOINK);
    box(-0.27, 0.27, 0, 0.03, 0.24, 0.42, M("#e7e0cc"), true, crt); // keyboard in front of the screen
    const kb = new THREE.Group(); kb.position.set(77.7, f + 0.78, -20.05); kb.rotation.y = -0.3; R.add(kb); box(-0.32, 0.32, 0, 0.035, -0.12, 0.12, M("#e7e0cc"), true, kb);
    box(76.45, 77.25, f + 0.36, f + 1.45, -20.75, -20.62, M("#3f6fb5")); box(76.45, 77.25, f + 0.32, f + 0.4, -20.62, -20.25, M("#3f6fb5")); box(76.82, 76.88, f, f + 0.32, -20.47, -20.41, M("#4a4f5a"));
    const posterT = cv(256, 360, (g) => { g.fillStyle = "#241726"; g.fillRect(0, 0, 256, 360); g.fillStyle = "#ffd21f"; g.fillRect(14, 14, 228, 332); g.fillStyle = "#2f9be0"; g.fillRect(28, 28, 200, 200); coinGlyph(g, 128, 128, 70); g.fillStyle = "#241726"; for (let k = 0; k < 4; k++) g.fillRect(40, 250 + k * 22, 176 - k * 30, 10); });
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.12), new THREE.MeshLambertMaterial({ map: posterT })); poster.position.set(76.2, f + 1.9, H.z0 + 0.03); R.add(poster);
    box(74.4, 75.15, f, f + 1.9, -20.7, -20.25, M("#a8743e")); for (let k = 0; k < 3; k++) box(74.45, 75.1, f + 0.5 + k * 0.55, f + 0.53 + k * 0.55, -20.68, -20.27, M("#7a5230"), false);
    for (let k = 0; k < 9; k++) box(74.5 + k * 0.065, 74.55 + k * 0.065, f + 0.53, f + 0.8 + 0.1 * rnd(k), -20.6, -20.35, M(FC[k % 5]), false);
    // open pizza box on the desk + growing stack of boxes by the porch
    const pboxM = M("#e7c38d");
    const openBox = new THREE.Group(); openBox.position.set(79.7, f + 0.78, -20.3); R.add(openBox);
    box(-0.28, 0.28, 0, 0.05, -0.28, 0.28, pboxM, true, openBox); const lid = box(-0.28, 0.28, 0, 0.02, -0.56, 0, pboxM, true, openBox); lid.position.set(0, 0, -0.28); lid.rotation.x = 1.2; lid.position.y = 0.04;
    const ptop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 32), [M("#e0a24a"), M("#f2c14e", cv(256, 256, (g) => { const p = new Pen(g); pizzaTop(p, 128, 128, 120); })), M("#e0a24a")]); ptop.position.y = 0.065; openBox.add(ptop);
    const boxTopT = cv(256, 256, (g) => { g.fillStyle = "#e7c38d"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#b48a52"; g.lineWidth = 6; g.strokeRect(10, 10, 236, 236); const p = new Pen(g); pizzaTop(p, 128, 128, 60); });
    for (let k = 0; k < 14; k++) { const b = box(-0.3, 0.3, 0, 0.09, -0.3, 0.3, [pboxM, pboxM, M("#ffffff", boxTopT), pboxM, pboxM, pboxM] as any, true); b.userData.k = k; this.boxes.push(b); }
    // 2010 sidewalk stand: tiny table, hand sign, a single coin, a birthday cake with one candle
    box(STAND[0] - 0.6, STAND[0] + 0.6, 0.85, 0.9, STAND[2] - 0.35, STAND[2] + 0.35, M("#f4efe6")); for (const s of [-1, 1]) box(STAND[0] + s * 0.5 - 0.03, STAND[0] + s * 0.5 + 0.03, 0.15, 0.85, STAND[2] - 0.03, STAND[2] + 0.03, M("#7a5230"));
    const signT = cv(256, 160, (g) => { g.fillStyle = "#fffbe8"; g.fillRect(0, 0, 256, 160); g.strokeStyle = "#241726"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 152); coinGlyph(g, 60, 80, 40); g.fillStyle = "#241726"; g.font = "900 46px Mont, sans-serif"; g.fillText("COIN?", 108, 98); });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.56), new THREE.MeshLambertMaterial({ map: signT })); sign.position.set(STAND[0], 1.35, STAND[2] - 0.32); R.add(sign);
    box(STAND[0] - 0.02, STAND[0] + 0.02, 0.9, 1.08, STAND[2] - 0.33, STAND[2] - 0.31, M("#7a5230"), false);
    this.coin3 = new THREE.Group(); const cm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 28).rotateX(Math.PI / 2), [M("#d99a1a"), M("#ffffff", cv(128, 128, (g) => coinGlyph(g, 64, 64, 56, false))), M("#ffffff", cv(128, 128, (g) => coinGlyph(g, 64, 64, 56, false)))]);
    this.coin3.add(cm); this.coin3.position.set(STAND[0] - 0.25, 1.05, STAND[2]); R.add(this.coin3);
    const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 24), [M("#f07ad0"), M("#fff3f8"), M("#f07ad0")]); cake.position.set(STAND[0] + 0.3, 0.97, STAND[2]); cake.castShadow = true; R.add(cake);
    this.candle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), M("#2f9be0")); this.candle.position.set(STAND[0] + 0.3, 1.1, STAND[2]); R.add(this.candle);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2, 0.6), fog: false })); flame.scale.y = 1.6; flame.position.set(STAND[0] + 0.3, 1.19, STAND[2]); flame.layers.set(NOINK); R.add(flame);
    // gold coin piles on the lawn ($1.1 billion)
    for (let k = 0; k < 9; k++) {
      const g = new THREE.Group(), n = 6 + Math.floor(rnd(k) * 12);
      for (let j = 0; j < n; j++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 28), M(j % 2 ? "#ffc93a" : "#f2b62a")); c.position.set(0.05 * Math.sin(j * 2.1), 0.06 + j * 0.122, 0.05 * Math.cos(j * 1.7)); c.castShadow = true; g.add(c); }
      g.position.set(66.0 + (k % 3) * 1.15 + 0.35 * rnd(k + 4), 0, -9.9 + Math.floor(k / 3) * 0.95); g.userData = { k, n }; this.coins.push(g); R.add(g);
    }
    // price tag (pops over the CRT on "its very first price")
    const tagT = cv(512, 300, (g) => { g.fillStyle = "#241726"; g.beginPath(); g.moveTo(80, 10); g.lineTo(500, 10); g.lineTo(500, 290); g.lineTo(80, 290); g.lineTo(10, 150); g.closePath(); g.fill(); g.fillStyle = "#ffd21f"; g.beginPath(); g.moveTo(88, 24); g.lineTo(486, 24); g.lineTo(486, 276); g.lineTo(88, 276); g.lineTo(28, 150); g.closePath(); g.fill(); g.fillStyle = "#241726"; g.beginPath(); g.arc(70, 150, 16, 0, 7); g.fill(); coinGlyph(g, 190, 150, 70); g.fillStyle = "#241726"; g.font = "900 120px Mont, sans-serif"; g.fillText("=", 275, 190); pizzaTop(new Pen(g), 410, 150, 62); });
    this.tag = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.42), new THREE.MeshBasicMaterial({ map: tagT, alphaTest: 0.5, fog: false, side: THREE.DoubleSide })); this.tag.layers.set(NOINK); R.add(this.tag);
    this.sets = new Sets(R, box);
    buildTown(R);
    // GPU "thousand workers": instanced cut-out cards (4 pre-drawn variants), standing with laptops, typing bob
    for (let v = 0; v < 4; v++) {
      const c = document.createElement("canvas"); c.width = 450; c.height = 500; const g = c.getContext("2d")!;
      drawChar3(g, extra(20 + v * 3), 225, 488, 0.5, { prop: "laptop", L: "hold", R: "hold", expr: (["flat", "o", "neutral", "flat"] as const)[v] } as any, v * 1.3, "front", 1);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const geo = new THREE.PlaneGeometry(1.944, 2.16); geo.translate(0, 2.16 * 0.475, 0);
      const im = new THREE.InstancedMesh(geo, cardShade(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide })), 60); im.layers.set(NOINK); im.frustumCulled = false; R.add(im); this.workers.push(im);
    }
  }

  card(i: number) {
    while (this.cards.length <= i) {
      const c = document.createElement("canvas"); c.width = 900; c.height = 1000; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const g = new THREE.PlaneGeometry(1.944, 2.16); g.translate(0, 2.16 * 0.475, 0);
      const mat = cardShade(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }));
      const mesh = new THREE.Mesh(g, mat); mesh.layers.set(NOINK); mesh.renderOrder = 1; mesh.receiveShadow = false; mesh.rotation.order = "YXZ"; this.root.add(mesh);
      const bt = cv(128, 64, (q) => { const gr = q.createRadialGradient(64, 32, 4, 64, 32, 62); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); q.fillStyle = "#ffffff"; q.fillRect(0, 0, 128, 64); q.save(); q.scale(1, 0.5); q.fillStyle = "rgb(168,162,178)"; q.beginPath(); q.ellipse(64, 64, 58, 54, 0, 0, 7); q.fill(); q.restore(); });
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.5).rotateX(-Math.PI / 2), blobMaterial(bt)); blob.layers.set(NOINK); blob.renderOrder = 0.5; this.root.add(blob);
      this.cards.push({ mesh, blob, c, tex, key: "" });
    }
    return this.cards[i];
  }

  drawScreen(t: number, s: Shot) {
    const S = this.screen, shot = s.id;
    const mode = shot === "game" ? (t < 52.56 ? "game" : "nogame") : shot === "forum" ? "forum" : shot === "coin" ? "coin" : (s.scr ?? "desk");
    const fr = Math.floor(t * 15), key = mode + (mode === "desk" ? "" : fr);
    if (key === S.key) return; S.key = key;
    const g = S.c.getContext("2d")!, W = 512, Hh = 384;
    const page = (title: string) => { g.fillStyle = "#eef2f7"; g.fillRect(0, 0, W, Hh); g.fillStyle = "#e8902a"; g.fillRect(0, 0, W, 54); coinGlyph(g, 32, 27, 18, false); txt(g, title, 60, 37, 26, "#ffffff"); };
    const wrap = (str: string, x: number, y: number, px: number, maxW: number, col: string, n = 999) => { g.font = `900 ${px}px Mont, sans-serif`; g.fillStyle = col; g.textAlign = "left"; let line = "", yy = y, used = 0; for (const wd of str.split(" ")) { if (used >= n) break; const tst = line ? line + " " + wd : wd; if (g.measureText(tst).width > maxW && line) { g.fillText(line, x, yy); yy += px * 1.25; line = wd; } else line = tst; used++; } if (line) g.fillText(line, x, yy); };
    const rows = (k0: number) => { for (let r = k0; r < 9; r++) { g.fillStyle = r % 2 ? "#dde5ef" : "#ffffff"; g.fillRect(10, 64 + r * 34, W - 20, 30); g.fillStyle = ["#e8402f", "#2f9be0", "#3fbf6a", "#7b5ac9", "#ffd21f"][r % 5]; g.beginPath(); g.arc(28, 79 + r * 34, 10, 0, 7); g.fill(); g.fillStyle = "#5a6a80"; g.fillRect(46, 74 + r * 34, 90 + ((r * 53) % 120), 8); g.fillRect(260, 74 + r * 34, 60 + ((r * 31) % 90), 8); } };
    if (mode === "game" || mode === "nogame") {
      g.fillStyle = "#14223a"; g.fillRect(0, 0, W, Hh); g.fillStyle = "#3a8fe0"; g.fillRect(0, 0, W, Hh);
      const k = mode === "nogame" ? clamp01((t - 52.56) / 0.35) : 0;
      g.save(); g.globalAlpha = 1 - k; g.fillStyle = "#3fbf6a"; g.fillRect(0, 320, W, 64); g.fillStyle = "#a8743e"; for (const [x, y] of [[60, 230], [300, 180]]) g.fillRect(x, y, 140, 26);
      g.fillStyle = "#e8402f"; const hx = 100 + ((t * 120) % 300); g.fillRect(hx, 280 - Math.abs(Math.sin(t * 6)) * 60, 28, 40); g.restore();
      if (k > 0.99) { g.fillStyle = "#14223a"; g.fillRect(0, 0, W, Hh); }
      coinGlyph(g, 256, 140 - Math.abs(Math.sin(t * 5)) * 30 * (1 - k), 44);
    } else if (mode === "forum") { page("FORUM"); rows(0); g.fillStyle = "#241726"; g.fillRect(150 + ((fr % 2) ? 0 : 1), 250, 3, 18); }
    else if (mode === "coin" || mode === "code") {
      g.fillStyle = "#1a2c4a"; g.fillRect(0, 0, W, Hh); g.fillStyle = "#7ddf8a";
      const n = mode === "coin" ? Math.min(14, Math.floor((t - 35.1) * 6)) : 14, off = mode === "code" ? Math.floor(t * 4) : 0;
      for (let r = 0; r < n; r++) g.fillRect(24 + ((r + off) % 3) * 18, 24 + r * 22, 80 + (((r + off) * 97) % 300), 10);
      if (mode === "coin") { const k = easeOut((t - 37.3) / 0.4); if (k > 0) coinGlyph(g, 256, 192, 30 + 70 * k); }
    } else if (mode === "hash") {
      g.fillStyle = "#14223a"; g.fillRect(0, 0, W, Hh); txt(g, "MINING", 24, 50, 34, "#7ddf8a");
      for (let r = 0; r < 6; r++) { const w = ((t * (120 + r * 37) + r * 60) % 440); g.fillStyle = "#24365a"; g.fillRect(24, 80 + r * 40, 460, 24); g.fillStyle = r % 2 ? "#3fbf6a" : "#7ddf8a"; g.fillRect(24, 80 + r * 40, w, 24); }
      for (let k = 0; k < 3; k++) { const ph = (t * 1.7 + k / 3) % 1; coinGlyph(g, 400 + k * 30, 60 - ph * 30, 14 * (1 - ph) + 4, false); }
    } else if (mode === "newpost" || mode === "post") {
      page("FORUM: NEW TOPIC"); g.fillStyle = "#ffffff"; g.fillRect(14, 66, W - 28, Hh - 80); g.strokeStyle = "#9aa8bb"; g.lineWidth = 3; g.strokeRect(14, 66, W - 28, Hh - 80);
      txt(g, "Pizza for bitcoins?", 30, 104, 30, "#241726");
      const q = "I'll pay 10,000 bitcoins for a couple of pizzas, like maybe two large ones, so I have some left over for the next day.";
      const words = mode === "post" ? 999 : Math.floor(clamp01((t - 157.6) / 3.2) * 22);
      wrap(q, 30, 150, 25, W - 60, "#33405a", words);
      if (mode === "newpost" && fr % 2) { g.fillStyle = "#241726"; g.fillRect(30 + (words % 8) * 50, 300, 3, 20); }
    } else if (mode === "fish") {
      page("TOPPINGS"); const items = ["ONIONS", "PEPPERS", "SAUSAGE", "MUSHROOMS", "PEPPERONI"]; items.forEach((it, i) => txt(g, it, 40, 100 + i * 34, 26, "#33405a"));
      g.fillStyle = "#2f9be0"; g.beginPath(); g.ellipse(380, 210, 70, 34, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(440, 210); g.lineTo(480, 180); g.lineTo(480, 240); g.fill(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(345, 200, 8, 0, 7); g.fill();
      const k = easeOut((t - 175.9) / 0.25); if (k > 0) { g.lineCap = "round"; for (const [w, c] of [[30, "#241726"], [18, "#e8402f"]] as const) { g.lineWidth = w * k; g.strokeStyle = c; g.beginPath(); g.moveTo(300, 140); g.lineTo(470, 280); g.moveTo(470, 140); g.lineTo(300, 280); g.stroke(); } }
    } else if (mode === "empty") { page("PIZZA FOR BITCOINS?"); g.fillStyle = "#ffffff"; g.fillRect(14, 66, W - 28, 120); wrap("I'll pay 10,000 bitcoins for a couple of pizzas...", 30, 110, 22, W - 60, "#33405a"); txt(g, "NO REPLIES YET", W / 2, 280, 34, "#9aa8bb", "center"); }
    else if (mode === "math") { page("PIZZA FOR BITCOINS?"); rows(3); g.fillStyle = "#fffbe8"; g.fillRect(40, 70, W - 80, 90); txt(g, "10,000 BTC = $ ???", W / 2, 130, 40, "#c8363a", "center"); }
    else if (mode === "reply") { page("PIZZA FOR BITCOINS?"); rows(4); const k = easeOut((t - 201.3) / 0.3); if (k > 0) { g.fillStyle = "#fff3c4"; g.fillRect(20, 70, (W - 40) * k, 66); g.strokeStyle = "#e8902a"; g.lineWidth = 4; g.strokeRect(20, 70, (W - 40) * k, 66); if (k > 0.9) txt(g, "NEW REPLY: jercos", 40, 113, 30, "#241726"); } }
    else if (mode === "send") { g.fillStyle = "#14223a"; g.fillRect(0, 0, W, Hh); txt(g, "SEND 10,000 BTC", W / 2, 120, 40, "#ffffff", "center"); txt(g, "TO: jercos", W / 2, 170, 28, "#9fd4ef", "center"); const k = clamp01((t - 238.2) / 2.2); g.fillStyle = "#24365a"; g.fillRect(56, 220, 400, 34); g.fillStyle = "#3fbf6a"; g.fillRect(56, 220, 400 * k, 34); if (k >= 1) txt(g, "SENT!", W / 2, 320, 46, "#ffd21f", "center"); }
    else if (mode === "report") { page("PIZZA FOR BITCOINS?"); g.fillStyle = "#ffffff"; g.fillRect(14, 66, W - 28, Hh - 80); wrap("I just want to report that I successfully traded 10,000 bitcoins for pizza.", 30, 110, 26, W - 220, "#33405a"); g.fillStyle = "#e7c38d"; g.fillRect(330, 190, 160, 150); pizzaTop(new Pen(g), 410, 265, 66); }
    else if (mode === "closed") { page("PIZZA FOR BITCOINS?"); rows(2); const k = easeOut((t - 331.9) / 0.25); if (k > 0) { g.save(); g.translate(W / 2, 200); g.rotate(-0.15); g.scale(1.6 - 0.6 * k, 1.6 - 0.6 * k); g.strokeStyle = "#c8363a"; g.lineWidth = 10; g.strokeRect(-190, -50, 380, 100); txt(g, "OFFER CLOSED", 0, 18, 50, "#c8363a", "center"); g.restore(); } }
    else if (mode === "faucet") { g.fillStyle = "#e8f6ff"; g.fillRect(0, 0, W, Hh); g.fillStyle = "#3fbf6a"; g.fillRect(0, 0, W, 64); txt(g, "FREE BITCOINS", W / 2, 46, 36, "#ffffff", "center"); g.fillStyle = "#8a8f9a"; g.fillRect(200, 90, 112, 30); g.fillRect(286, 120, 26, 40); for (let k = 0; k < 4; k++) { const ph = (t * 0.9 + k / 4) % 1; coinGlyph(g, 299, 175 + ph * 170, 18, false); } txt(g, "ASK. GET COINS.", W / 2, 360, 24, "#33405a", "center"); }
    else if (mode === "number") { g.fillStyle = "#14223a"; g.fillRect(0, 0, W, Hh); txt(g, "BALANCE", W / 2, 110, 34, "#9fd4ef", "center"); coinGlyph(g, 150, 220, 46, false); for (let k = 0; k < 5; k++) { g.fillStyle = "#ffd21f"; g.fillRect(220 + k * 46, 196, 34, 52); } if (fr % 2) { g.fillStyle = "#ffffff"; g.fillRect(452, 196, 4, 52); } }
    else { g.fillStyle = "#2f9be0"; g.fillRect(0, 0, W, Hh); coinGlyph(g, 256, 192, 60); }
    S.tex.needsUpdate = true;
  }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / 30, C = camAt(t), s = C.shot as Shot;
    cam.position.set(...C.pos); cam.up.set(0, 1, 0); cam.lookAt(...C.look); cam.rotateZ(C.roll); cam.fov = C.fov; cam.near = s.inside ? 0.06 : 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    // one sun for the whole town; the shadow box is frozen per shot (no shimmer)
    let sc = this.shadowC.get(s.id); if (!sc) { const m = camAt((s.a + s.b) / 2); sc = new THREE.Vector3(...m.look); this.shadowC.set(s.id, sc); }
    this.sun.position.copy(sc).addScaledVector(SUN_DIR, 160); this.sun.target.position.copy(sc); this.sun.target.updateMatrixWorld();
    const shc = this.sun.shadow.camera; shc.left = shc.bottom = -s.shadow; shc.right = shc.top = s.shadow; shc.near = 1; shc.far = 420; shc.updateProjectionMatrix();
    this.sun.shadow.normalBias = 0.02 * (s.shadow / 25); this.sun.shadow.bias = -0.0004;
    this.sun.intensity = L.sunI;
    TONE.uLitCol.value.set(1.5, 1.46, 1.34); TONE.uShadeCol.value.set(0.52, 0.53, 0.66); TONE.uShadeLift.value.set(0.05, 0.06, 0.1);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = 1.12;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    untone("#bcd8f2", this.fog.color); this.fog.near = 70; this.fog.far = 560; scene.fog = this.fog; scene.background = null;
    for (const o of this.houseShell) o.visible = s.inside !== "house";
    this.sets.update(t, s); this.sets.drawLaptop(t, s.lap ?? "forum");
    // props over time
    const doorOpen = [[13.2, 30], [246.4, 250], [314.6, 323.4], [479, 486.4]].reduce((m, [a, b]) => Math.max(m, smooth((t - a) / 0.5) * (1 - smooth((t - b) / 0.5))), 0);
    this.door.rotation.y = -1.6 * doorOpen;
    for (const b of this.balloons) { const u = b.userData; b.position.set(u.x + 0.3 * Math.sin(t * 0.9 + u.p), u.y + 0.25 * Math.sin(t * 1.3 + u.p), u.z); b.rotation.z = 0.08 * Math.sin(t * 1.1 + u.p); }
    const dm = new THREE.Object3D(), conf = t < 7 || (t > 551.85 && t < 556.7);
    for (let i = 0; i < 260; i++) {
      const ph = rnd(i * 3.3), x = -58 + rnd(i) * 18, z = -13 + rnd(i + 0.5) * 12, fall = ((t * (0.9 + 0.6 * ph) + ph * 6) % 6);
      dm.position.set(x + 0.4 * Math.sin(t * 2 + i), 7 - fall * 1.15, z); dm.rotation.set(t * 3 + i, t * 2 + i * 0.7, 0); dm.scale.setScalar(conf ? 1 : 0); dm.updateMatrix();
      this.confetti.setMatrixAt(i, dm.matrix);
    }
    this.confetti.instanceMatrix.needsUpdate = true;
    { const k = easeOut((t - 7.15) / 0.18); this.fancyX.visible = t > 7.15 && t < 8.5; this.fancyX.position.set(PEDESTAL[0], 1.42, PEDESTAL[2] + 0.5); this.fancyX.scale.setScalar(Math.max(0.01, 1.6 - 0.6 * k)); this.fancyX.quaternion.copy(cam.quaternion); }
    for (const g of this.coins) { const { k } = g.userData; let u = 0;
      if (s.id === "billion") u = easeOut((t - 19.36 - k * 0.07) / 0.35); else if (s.id === "pile") u = 1 - easeOut((t - 335.0 - k * 0.1) / 0.4);
      g.visible = u > 0.01; g.scale.set(1, Math.max(0.01, u), 1); }
    const nb = s.id === "porch" ? (t > 26.9 ? Math.floor(2 + 12 * clamp01((t - 27.0) / 1.6)) : 0) : s.id === "pile" ? Math.floor(14 * clamp01((t - 335.2) / 1.6)) : 0, t0b = s.id === "pile" ? 335.2 : 27.0;
    for (const b of this.boxes) { const k = b.userData.k, on = k < nb; b.visible = on; if (on) { const drop = 1 - easeOut((t - t0b - (k - 2) * 0.115) / 0.15); b.position.set(75.3 + 0.02 * Math.sin(k * 2.3), 0.25 + k * 0.0905 + Math.max(0, drop) * 0.8 * (k >= 2 ? 1 : 0), -10.3); b.rotation.y = 0.12 * Math.sin(k * 1.7); } }
    { const k = easeOut((t - 39.4) / 0.35); this.tag.visible = s.id === "coin" && k > 0; this.tag.position.set(CRT.pos[0] - 0.05, CRT.pos[1] + 0.82 + 0.03 * Math.sin(t * 3), CRT.pos[2] + 0.25); this.tag.scale.setScalar(Math.max(0.01, k)); this.tag.quaternion.copy(cam.quaternion); this.tag.rotateZ(0.06 * Math.sin(t * 2)); }
    this.coin3.rotation.y = t * 2.2; this.coin3.position.y = 1.08 + 0.03 * Math.sin(t * 3);
    this.drawScreen(t, s);
    // GPU worker crowd (billboards toward the camera, typing bob)
    { const yaw = Math.atan2(cam.position.x - (LOT.gpu[0] + 2), cam.position.z - (LOT.gpu[2] + 2)), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), o = new THREE.Object3D();
      let n = 0;
      for (let r = 0; r < 10; r++) for (let c = 0; c < 16; c++) { const v = (r * 7 + c * 3) % 4, im = this.workers[v], idx = Math.floor(n / 4); n++;
        if (idx >= 60) continue; const x = LOT.gpu[0] - 3 + c * 0.72 + (r % 2) * 0.36, z = LOT.gpu[2] - 2.6 + r * 0.95;
        o.position.set(x, 0.08 + 0.025 * Math.abs(Math.sin(t * 9 + r * 1.3 + c)), z); o.quaternion.copy(q); o.scale.setScalar(0.6); o.updateMatrix(); im.setMatrixAt(idx, o.matrix); }
      for (const im of this.workers) { im.count = 40; im.instanceMatrix.needsUpdate = true; } }
    // cast cards: view from heading vs camera (front / 3-4 / side / back), lip-sync for whoever speaks
    const who = cast(t), spk = speakerAt(t), tk = talkAt(t);
    const cr = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0); cr.y = 0; cr.normalize();
    who.forEach((w, i) => {
      const cd = this.card(i), k = w.k ?? 1;
      let view: View = "front", vs = 1, sq = 1;
      if (w.hd !== undefined && !w.lie && w.st.mode !== "sit") {
        const dx = Math.sin(w.hd), dz = Math.cos(w.hd); let tx = cam.position.x - w.pos[0], tz = cam.position.z - w.pos[2]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const fz = dx * tx + dz * tz, sx = dx * cr.x + dz * cr.z, a = (Math.atan2(Math.abs(sx), fz) * 180) / Math.PI; vs = sx >= 0 ? 1 : -1;
        view = a < 24 ? "front" : a < 66 ? "q" : a < 118 ? "side" : "back";
        for (const bnd of [24, 66, 118]) { const dd = Math.abs(a - bnd); if (dd < 6) sq = Math.min(sq, 0.86 + 0.14 * (dd / 6)); }
        if (view === "q") sq *= 0.95;
      }
      const st = { ...w.st, talk: w.c.name === spk && view !== "back" && view !== "side" ? tk : 0 };
      const key = JSON.stringify([w.c.name, st, view, vs, Math.round(t * 30) % 2]);
      if (key !== cd.key) {
        const g = cd.c.getContext("2d")!; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 900, 1000);
        drawChar3(g, w.c, 450, 975, 1, st, t, view, vs);
        if (view === "side" && (st.prop === "boxes" || st.prop === "box")) { const p = new Pen(g), bx = 450 + (vs < 0 ? -70 : 70); for (let j = st.prop === "boxes" ? 1 : 0; j >= 0; j--) pizzaBox(p, bx, 600 - j * 40, 200); }
        cd.tex.needsUpdate = true; cd.key = key;
      }
      cd.mesh.visible = true; cd.mesh.position.set(...w.pos);
      if (w.lie) { cd.mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0))); cd.mesh.scale.set(k * 0.85, k * 0.85, k * 0.85); }
      else { cd.mesh.rotation.set(0, Math.atan2(cam.position.x - w.pos[0], cam.position.z - w.pos[2]), 0); cd.mesh.scale.set(k * sq, k, k); }
      cd.blob.visible = w.blob !== false && !w.lie;
      cd.blob.position.set(w.pos[0], groundY(w.pos[0], w.pos[2]) + 0.012, w.pos[2]);
      cd.blob.scale.setScalar(k * (w.st.mode === "stroll" ? 0.8 : 1));
    });
    for (let i = who.length; i < this.cards.length; i++) { this.cards[i].mesh.visible = false; this.cards[i].blob.visible = false; }
    return new THREE.Vector3(...C.look);
  }
}
