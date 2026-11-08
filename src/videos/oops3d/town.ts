// Dense background town: merged wall/roof geometry (one draw call each), instanced trees, lamps, parked cars, rooftop units.
// Fills every lot from the second row back to the horizon; keep-out boxes protect the story sets.
import * as THREE from "three";
import { M, cv, rnd } from "./util3d";
import { twoTone } from "../molasses/shade";

type KO = [number, number, number, number]; // x0 x1 z0 z1
export const KEEP: KO[] = [
  [115, 248, -72, -8],   // chart square (south)
  [-26, 16, 8, 44],      // lottery square (north)
  [-70, -30, -30, -5],   // 2025 plaza
];
const blocked = (x0: number, x1: number, z0: number, z1: number) => KEEP.some(([a, b, c, d]) => x1 > a && x0 < b && z1 > c && z0 < d);
const WALL = ["#f2dcae", "#cfe6f2", "#f6c9b8", "#e2efc7", "#fbe7a1", "#d9cdf2", "#e8e2d6", "#f0c7a0", "#c9d8e8", "#f4d6d6", "#d8e6c8", "#ece0c4"];

export const buildTown = (R: THREE.Object3D) => {
  const winT = cv(128, 128, (g) => {
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 128, 128);
    g.fillStyle = "#e9e9e9"; g.fillRect(0, 118, 128, 10);
    g.fillStyle = "#2e3a4a"; g.fillRect(30, 26, 68, 64); g.fillStyle = "#5b7896"; g.fillRect(34, 30, 60, 26); g.fillStyle = "#3d4f64"; g.fillRect(34, 58, 60, 28);
    g.fillStyle = "#ffffff"; g.fillRect(62, 26, 4, 64); g.fillStyle = "#cfcfcf"; g.fillRect(26, 90, 76, 7);
  });
  winT.wrapS = winT.wrapT = THREE.RepeatWrapping; winT.anisotropy = 4;
  const P: number[] = [], N: number[] = [], U: number[] = [], C: number[] = [], RP: number[] = [], RN: number[] = [], RC: number[] = [];
  const quad = (pa: number[][], n: number[], uv: number[][] | null, col: THREE.Color, roof = false) => {
    const idx = [0, 1, 2, 0, 2, 3];
    for (const i of idx) {
      (roof ? RP : P).push(...pa[i]); (roof ? RN : N).push(...n); (roof ? RC : C).push(col.r, col.g, col.b);
      if (!roof) U.push(...uv![i]);
    }
  };
  const roofs: THREE.Matrix4[] = [], units: THREE.Matrix4[] = [];
  const bld = (x0: number, x1: number, z0: number, z1: number, h: number, ci: number) => {
    const col = new THREE.Color(WALL[ci % WALL.length]), w = x1 - x0, d = z1 - z0, fl = 3.2, bay = 3.0;
    const uw = Math.max(1, Math.round(w / bay)), ud = Math.max(1, Math.round(d / bay)), vh = h / fl;
    quad([[x0, -0.2, z1], [x1, -0.2, z1], [x1, h, z1], [x0, h, z1]], [0, 0, 1], [[0, 0], [uw, 0], [uw, vh], [0, vh]], col);
    quad([[x1, -0.2, z0], [x0, -0.2, z0], [x0, h, z0], [x1, h, z0]], [0, 0, -1], [[0, 0], [uw, 0], [uw, vh], [0, vh]], col);
    quad([[x1, -0.2, z1], [x1, -0.2, z0], [x1, h, z0], [x1, h, z1]], [1, 0, 0], [[0, 0], [ud, 0], [ud, vh], [0, vh]], col);
    quad([[x0, -0.2, z0], [x0, -0.2, z1], [x0, h, z1], [x0, h, z0]], [-1, 0, 0], [[0, 0], [ud, 0], [ud, vh], [0, vh]], col);
    const rc = col.clone().multiplyScalar(0.72);
    quad([[x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0]], [0, 1, 0], null, rc, true);
    if (rnd(x0 * 1.3 + z0) < 0.6) { const m = new THREE.Matrix4().compose(new THREE.Vector3(x0 + w * (0.3 + 0.4 * rnd(z0)), h + 0.6, z0 + d * 0.5), new THREE.Quaternion(), new THREE.Vector3(Math.min(3, w * 0.3), 1.2, Math.min(3, d * 0.3))); units.push(m); }
  };
  let ci = 0;
  // rows of blocks on both sides, behind the first (story) row; streets every ~50 m in x, every 24 m in z
  for (const side of [-1, 1]) {
    for (let r = 0; r < 18; r++) {
      const zA = 30 + r * 24, zB = zA + 15; // block depth 15 m, 9 m street
      const z0 = side > 0 ? zA : -zB, z1 = side > 0 ? zB : -zA;
      for (let bx = -720; bx < 720; bx += 50) {
        let x = bx + 4;
        while (x < bx + 46) {
          const w = Math.min(bx + 46 - x, 8 + Math.floor(rnd(x * 0.7 + r * 13 + side) * 9));
          if (w < 5) break;
          const far = Math.min(1, r / 8) + Math.min(1, Math.abs(bx) / 600) * 0.3;
          const h = 6 + Math.floor(rnd(x + r * 31 + side * 7) * (8 + 34 * far)) + (r > 3 && rnd(x * 3.1 + r) < 0.12 ? 30 : 0);
          const dz = 10 + Math.floor(rnd(x + 5 * r) * 3);
          const zz0 = side > 0 ? z0 : z1 - dz, zz1 = side > 0 ? z0 + dz : z1;
          if (!blocked(x, x + w - 0.4, Math.min(zz0, zz1), Math.max(zz0, zz1))) bld(x, x + w - 0.4, Math.min(zz0, zz1), Math.max(zz0, zz1), h, ci++);
          x += w;
        }
      }
    }
  }
  // the first row beyond the story stretch (x < -150 and x > 165) and behind protected sets: extra buildings
  for (const side of [-1, 1]) for (let x = -720; x < 720; x += 11) {
    if (x > -152 && x < 168) continue;
    const z0 = side > 0 ? 12 : -24, z1 = side > 0 ? 24 : -12, h = 7 + Math.floor(rnd(x * 1.7 + side) * 9);
    if (!blocked(x, x + 10, z0, z1)) bld(x, x + 10, z0, z1, h, ci++);
  }
  const gW = new THREE.BufferGeometry(); gW.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); gW.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3)); gW.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); gW.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
  const walls = new THREE.Mesh(gW, twoTone(new THREE.MeshLambertMaterial({ map: winT, vertexColors: true }))); walls.castShadow = walls.receiveShadow = true; walls.frustumCulled = false; R.add(walls);
  const gR = new THREE.BufferGeometry(); gR.setAttribute("position", new THREE.Float32BufferAttribute(RP, 3)); gR.setAttribute("normal", new THREE.Float32BufferAttribute(RN, 3)); gR.setAttribute("color", new THREE.Float32BufferAttribute(RC, 3));
  const rf = new THREE.Mesh(gR, twoTone(new THREE.MeshLambertMaterial({ vertexColors: true }))); rf.receiveShadow = true; rf.frustumCulled = false; R.add(rf);
  const inst = (geo: THREE.BufferGeometry, mat: THREE.Material, ms: THREE.Matrix4[], cast = true) => { const im = new THREE.InstancedMesh(geo, mat, Math.max(1, ms.length)); ms.forEach((m, i) => im.setMatrixAt(i, m)); im.count = ms.length; im.castShadow = cast; im.receiveShadow = true; im.frustumCulled = false; R.add(im); return im; };
  inst(new THREE.BoxGeometry(1, 1, 1), M("#b8b4ac"), units);
  // back streets: asphalt strips + sidewalks (z = +-(45 + 24 r) +- 4.5)
  const strip: THREE.Matrix4[] = [], walk: THREE.Matrix4[] = [];
  for (const side of [-1, 1]) for (let r = 0; r < 18; r++) { const zc = side * (30 + r * 24 - 4.5); strip.push(new THREE.Matrix4().compose(new THREE.Vector3(0, 0.0, zc), new THREE.Quaternion(), new THREE.Vector3(1440, 0.12, 6))); }
  for (let bx = -720; bx <= 720; bx += 50) for (const sd of [-1, 1]) walk.push(new THREE.Matrix4().compose(new THREE.Vector3(bx, -0.06, sd * 246), new THREE.Quaternion(), new THREE.Vector3(7, 0.12, 436)));
  inst(new THREE.BoxGeometry(1, 1, 1), M("#5d6068"), strip, false); inst(new THREE.BoxGeometry(1, 1, 1), M("#5d6068"), walk.filter((m) => { const v = new THREE.Vector3().setFromMatrixPosition(m); return !(v.x > 112 && v.x < 250) && !(v.x > -30 && v.x < 18) && !(v.x > -72 && v.x < -28); }), false);
  // instanced trees + lamps along the back streets, parked cars
  const trunk: THREE.Matrix4[] = [], crown: THREE.Matrix4[] = [], lamp: THREE.Matrix4[] = [], body: THREE.Matrix4[] = [], cab: THREE.Matrix4[] = [];
  const carCols: THREE.Color[] = [];
  const CC = ["#e8402f", "#2f9be0", "#ffd21f", "#3fbf6a", "#f4efe6", "#4a4f5a", "#7b5ac9", "#d08a3a"];
  for (const side of [-1, 1]) for (let r = 0; r < 10; r++) for (let x = -700; x < 700; x += 17) {
    const zc = side * (30 + r * 24 - 4.5), zt = zc - side * 4.3;
    if (blocked(x - 2, x + 2, zt - 2, zt + 2)) continue;
    const s = 0.85 + 0.25 * rnd(x + r * 7 + side);
    if (r > 0 && rnd(x * 0.31 + r) < 0.7) { trunk.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 1.2 * s, zt), new THREE.Quaternion(), new THREE.Vector3(s, s, s))); crown.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 3.3 * s, zt), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd(x) * 3, 0)), new THREE.Vector3(s, s * (0.9 + 0.3 * rnd(x + 1)), s))); }
    if (r < 6 && (x + 700) % 34 === 0) lamp.push(new THREE.Matrix4().compose(new THREE.Vector3(x + 8, 2.2, zc - side * 3.6), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)));
    if (rnd(x * 1.9 + r * 3 + side) < 0.35) { const cz = zc - side * 2.1, cx = x + 6; if (!blocked(cx - 3, cx + 3, cz - 2, cz + 2)) { body.push(new THREE.Matrix4().compose(new THREE.Vector3(cx, 0.75, cz), new THREE.Quaternion(), new THREE.Vector3(4.2, 0.8, 1.8))); cab.push(new THREE.Matrix4().compose(new THREE.Vector3(cx - 0.1, 1.45, cz), new THREE.Quaternion(), new THREE.Vector3(2.3, 0.6, 1.64))); carCols.push(new THREE.Color(CC[Math.floor(rnd(cx + cz) * 8)])); } }
  }
  inst(new THREE.CylinderGeometry(0.16, 0.22, 2.4, 7), M("#8a5a34"), trunk);
  inst(new THREE.IcosahedronGeometry(1.6, 1), M("#4fae4a"), crown);
  const lp = new THREE.CylinderGeometry(0.06, 0.08, 4.4, 6); inst(lp, M("#4a4f5a"), lamp);
  const bodyIM = inst(new THREE.BoxGeometry(1, 1, 1), M("#ffffff"), body); carCols.forEach((c, i) => bodyIM.setColorAt(i, c)); if (bodyIM.instanceColor) bodyIM.instanceColor.needsUpdate = true;
  inst(new THREE.BoxGeometry(1, 1, 1), M("#bfe4f7"), cab);
  // ground cover for the whole town: pale paving (no grass fields)
};
