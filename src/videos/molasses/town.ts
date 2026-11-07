// Static scenery of the 1919 North End waterfront (procedural, no Kenney GLBs): brick tenement blocks with painted
// HD facades on the inland side of Commercial Street, low wharf warehouses on the harbour side, the Atlantic Avenue
// elevated railway over the street (iron columns, plate girders, ties), Copp's Hill with a white steeple, pilings,
// lamp posts, crates and barrels. Everything goes through Batch (one merged mesh per material, two-tone shading).
import * as THREE from "three";
import { Batch, lam, boxGeo, quad, tri, V, prop, Kit, Ray, setSight, inTheWay } from "./build";
import { rng, ctex, rep, brick, facadeHD, roofHD, stoneHD } from "./paint";
import { QUAY, TANK, TANK_R, EL_Y, EL_Z0, EL_Z1, elColX, FIREHOUSE, EL_HIT_X } from "./story";

type BStyle = { wall: string; shutter: string; brick: boolean; awning?: string };
const STY: BStyle[] = [
  { wall: "#b5543c", shutter: "#2f5f6a", brick: true, awning: "#2f6a43" },
  { wall: "#c47a5c", shutter: "#3b3f52", brick: true },
  { wall: "#d8a95f", shutter: "#2f6a43", brick: false, awning: "#b8553a" },
  { wall: "#a94a33", shutter: "#5a3b2a", brick: true, awning: "#3f6fb5" },
  { wall: "#ecdab2", shutter: "#3f6fb5", brick: false },
  { wall: "#b9603f", shutter: "#2f5f6a", brick: true },
];
const trim = () => lam("trimStone", () => ({ color: "#efe3c8" }));
const tar = () => lam("roofTar", () => ({ color: "#6a5a5c" }));
const awnT = (col: string) => ctex("awning" + col, 256, 64, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f3ead8" : col; g.fillRect(i * 32, 0, 32, 64); }
  g.fillStyle = "rgba(60,40,40,0.25)"; g.fillRect(0, 56, 256, 8);
});

/** flat-roofed block: front at z = zf facing dir (-1 = faces -z, toward the harbour; +1 = faces +z), width w along x,
 *  depth d, height h. Left out when it would stand in a camera's sight line. */
export const block = (b: Batch, x: number, zf: number, dir: 1 | -1, w: number, d: number, h: number, si: number) => {
  const z0 = dir < 0 ? zf : zf - d, z1 = dir < 0 ? zf + d : zf;
  if (inTheWay(x - w / 2 - 0.5, x + w / 2 + 0.5, 0, h + 1.2, z0 - 0.5, z1 + 0.5)) return;
  const st = STY[si % STY.length];
  const key = `blk${si % STY.length}_${w}_${h}`;
  const fac = lam(key, () => ({ map: facadeHD(key, w, h, { wall: st.wall, shutter: st.shutter, door: true, brick: st.brick }) }));
  const back = fac; // same painted facade on the back (seen only from the aerials)
  const side = lam("side" + key, () => (st.brick ? { map: rep(brick(), d / 4, h / 4) } : { color: st.wall }));
  const x0 = x - w / 2, x1 = x + w / 2;
  if (dir < 0) {
    b.add(quad(V(x1, 0, z0), V(x0, 0, z0), V(x0, h, z0), V(x1, h, z0)), fac);
    b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, h, z1), V(x0, h, z1)), back);
  } else {
    b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, h, z1), V(x0, h, z1)), fac);
    b.add(quad(V(x1, 0, z0), V(x0, 0, z0), V(x0, h, z0), V(x1, h, z0)), back);
  }
  b.add(quad(V(x0, 0, z0), V(x0, 0, z1), V(x0, h, z1), V(x0, h, z0)), side);
  b.add(quad(V(x1, 0, z1), V(x1, 0, z0), V(x1, h, z0), V(x1, h, z1)), side);
  b.add(quad(V(x0, h, z1), V(x1, h, z1), V(x1, h, z0), V(x0, h, z0)), tar());
  // cornice + parapet on the front, a thin string course over the shop floor
  const fz = dir < 0 ? z0 : z1, out = -dir;
  const zz = (a: number, c: number) => [Math.min(fz + out * a, fz + out * c), Math.max(fz + out * a, fz + out * c)] as const;
  { const [a, c] = zz(0, 0.42); b.add(boxGeo(V(x0 - 0.15, h - 0.55, a), V(x1 + 0.15, h + 0.35, c)), trim()); }
  { const [a, c] = zz(0, 0.12); b.add(boxGeo(V(x0, 3.25, a), V(x1, 3.45, c)), trim()); }
  if (st.awning && w >= 8) { // striped shop awning over the ground floor
    const zA = fz + out * 1.5, aw = lam("awn" + st.awning, () => ({ map: awnT(st.awning!), side: THREE.DoubleSide }));
    const p0 = V(x0 + 0.6, 3.05, fz + out * 0.02), p1 = V(x1 - 0.6, 3.05, fz + out * 0.02), p2 = V(x1 - 0.6, 2.45, zA), p3 = V(x0 + 0.6, 2.45, zA);
    b.add(dir > 0 ? quad(p3, p2, p1, p0, 4, 1) : quad(p0, p1, p2, p3, 4, 1), aw);
  }
  // a chimney stack or two
  const r = rng(Math.floor(x * 13 + zf * 7 + 99));
  for (let k = 0; k < 2; k++) if (r() < 0.7) {
    const cx = x0 + 1 + r() * (w - 2), cz = z0 + 1 + r() * (d - 2);
    b.add(boxGeo(V(cx - 0.45, h, cz - 0.35), V(cx + 0.45, h + 1.4, cz + 0.35)), lam("chim", () => ({ map: rep(brick(), 1, 1) })));
  }
};

const ironM = () => lam("elIron", () => ({ color: "#4f5d56" }));
const tieM = () => lam("elTie", () => ({ color: "#6e4a30" }));
const railM = () => lam("elRail", () => ({ color: "#8d949c" }));
/** one elevated-railway bent (two columns + cap girder) at x; built into its own batch when it must move (the hit) */
export const elBent = (b: Batch, x: number) => {
  for (const z of [EL_Z0, EL_Z1]) {
    b.add(boxGeo(V(x - 0.26, 0, z - 0.26), V(x + 0.26, EL_Y, z + 0.26)), ironM());
    b.add(boxGeo(V(x - 0.45, 0, z - 0.45), V(x + 0.45, 0.35, z + 0.45)), lam("elBase", () => ({ map: stoneHD("copeHD") })));
    // knee braces
    for (const s of [-1, 1]) b.add(boxGeo(V(x - 0.12, EL_Y - 1.2, z + s * 0.2 - 0.1), V(x + 0.12, EL_Y - 0.1, z + s * 0.2 + 0.1)), ironM());
  }
  b.add(boxGeo(V(x - 0.35, EL_Y, EL_Z0 - 0.6), V(x + 0.35, EL_Y + 0.75, EL_Z1 + 0.6)), ironM());
};
const elSpan = (b: Batch, xa: number, xb: number) => {
  for (const z of [EL_Z0, EL_Z1, (EL_Z0 + EL_Z1) / 2 - 1.2, (EL_Z0 + EL_Z1) / 2 + 1.2])
    b.add(boxGeo(V(xa, EL_Y + 0.75, z - 0.22), V(xb, EL_Y + 2.0, z + 0.22)), ironM());
  for (let x = xa + 0.4; x < xb; x += 0.9) b.add(boxGeo(V(x - 0.12, EL_Y + 2.0, EL_Z0 - 0.4), V(x + 0.12, EL_Y + 2.18, EL_Z1 + 0.4)), tieM());
  for (const z of [5.0, 5.9, 8.1, 9.0]) b.add(boxGeo(V(xa, EL_Y + 2.18, z - 0.05), V(xb, EL_Y + 2.32, z + 0.05)), railM());
};

/** the whole static waterfront; rays = every camera's sight lines (blocks there are left out) */
export const buildNorthEnd = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(19);
  setSight(rays);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  // inland blocks along Commercial Street (fronts at z = 16, facing the harbour), cross streets at x = -62 and 38
  for (const [xa, xb] of [[-170, -66], [-58, 34], [42, 170]]) {
    let x = xa;
    while (x < xb - 6) {
      const w = pick([8, 10, 12]), h = pick([8.4, 11.2, 14]);
      if (x + w > xb) break;
      block(b, x + w / 2, 16, -1, w, 12, h, Math.floor(r() * 6));
      x += w;
    }
  }
  // second and third rows (seen from the aerials and the crane), taller toward Copp's Hill
  for (const zf of [34, 52]) for (const [xa, xb] of [[-170, -66], [-58, 34], [42, 170]]) {
    let x = xa + r() * 4;
    while (x < xb - 8) {
      const w = pick([8, 10, 12]), h = pick([8.4, 11.2, 14]);
      if (x + w > xb) break;
      block(b, x + w / 2, zf, -1, w, 14, h, Math.floor(r() * 6));
      x += w + (r() < 0.2 ? 2 : 0);
    }
  }
  // harbour side: low warehouses and sheds facing the street (front z = -2), gaps for the tank lot and the firehouse
  {
    let x = -170;
    while (x < 170) {
      const w = pick([10, 12, 14]), h = pick([5.6, 7, 8.4]);
      const cx = x + w / 2;
      const nearTank = Math.abs(cx) < TANK_R + 10, nearFire = Math.abs(cx - FIREHOUSE[0]) < 6 + w / 2 + 1;
      if (!nearTank && !nearFire) block(b, cx, -2, 1, w, 14, h, 2 + Math.floor(r() * 4));
      x += w + 1.5;
    }
  }
  // the elevated railway along the street (the hit bent at EL_HIT_X is built by world.ts so it can move)
  for (let k = -17; k <= 17; k++) if (elColX(k) !== EL_HIT_X) elBent(b, elColX(k));
  for (let k = -17; k < 17; k++) {
    const xa = elColX(k), xb = elColX(k + 1);
    if (xa === EL_HIT_X || xb === EL_HIT_X) continue; // spans touching the hit bent live in world.ts
    elSpan(b, xa, xb);
  }
  // Copp's Hill with the white steeple behind the blocks
  const hill = new THREE.SphereGeometry(1, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  b.add(hill, lam("hillGrass", () => ({ color: "#7aa85a" })), new THREE.Matrix4().compose(V(-40, -2, 110), new THREE.Quaternion(), V(80, 22, 40)));
  for (let i = 0; i < 18; i++) {
    const x = -95 + r() * 110, z = 90 + r() * 30, y = Math.max(0, 20 * Math.sqrt(Math.max(0, 1 - ((x + 40) / 80) ** 2 - ((z - 110) / 40) ** 2)) - 2.5);
    if (y < 1) block(b, x, z, -1, pick([8, 10]), 10, pick([8.4, 11.2]), Math.floor(r() * 6));
  }
  const chW = lam("churchWhite", () => ({ color: "#f2ede2" })), chB = lam("churchBrick", () => ({ map: rep(brick(), 2, 5) }));
  b.add(boxGeo(V(-34, 0, 80), V(-26, 26, 88), 0), chB);
  b.add(boxGeo(V(-34.4, 26, 79.6), V(-25.6, 30, 88.4), 0), chW);
  b.add(boxGeo(V(-33, 30, 81), V(-27, 34, 87), 0), chW);
  const spire = new THREE.ConeGeometry(3.2, 16, 8, 1);
  b.add(spire, chW, new THREE.Matrix4().makeTranslation(-30, 42, 84));
  // wharf: pilings along the quay edge, bollards, a few crates and barrels
  const pile = lam("pile", () => ({ color: "#6e4a30" }));
  for (let x = -160; x <= 160; x += 3.2) b.add(new THREE.CylinderGeometry(0.22, 0.25, 3.4, 8).translate(0, 0, 0), pile, new THREE.Matrix4().makeTranslation(x, -1.3, QUAY - 0.3));
  const crate = lam("crate", () => ({ map: ctex("crateT", 128, 128, (g) => {
    g.fillStyle = "#b07a48"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "#6e4a30"; g.lineWidth = 10; g.strokeRect(5, 5, 118, 118);
    g.beginPath(); g.moveTo(10, 10); g.lineTo(118, 118); g.stroke();
  }) }));
  const barrel = lam("barrel", () => ({ color: "#8a5a34" }));
  for (const [x, z, s] of [[-30, -6, 1.1], [-31.3, -5.6, 0.9], [26, -26, 1.2], [-40, -28, 1], [30, -6.5, 0.9], [-22, -24, 1]] as const)
    b.add(boxGeo(V(x - s / 2, 0, z - s / 2), V(x + s / 2, s, z + s / 2)), crate);
  for (const [x, z] of [[-28.5, -7.2], [24, -28], [-42, -26], [22, -5.2]] as const)
    b.add(new THREE.CylinderGeometry(0.42, 0.42, 1.05, 12).translate(0, 0.525, 0), barrel, new THREE.Matrix4().makeTranslation(x, 0, z));
  // gas lamp posts on the inland sidewalk
  const lampP = lam("lampPost", () => ({ color: "#2f3a36" })), lampG = lam("lampGlass", () => ({ color: "#f5e6b8" }));
  for (let x = -150; x <= 150; x += 18) {
    if (inTheWay(x - 0.4, x + 0.4, 0, 4, 14.2, 15)) continue;
    b.add(new THREE.CylinderGeometry(0.07, 0.1, 3.6, 8).translate(0, 1.8, 0), lampP, new THREE.Matrix4().makeTranslation(x, 0, 14.6));
    b.add(boxGeo(V(x - 0.22, 3.6, 14.38), V(x + 0.22, 4.1, 14.82)), lampG);
    b.add(new THREE.ConeGeometry(0.34, 0.3, 4).rotateY(Math.PI / 4).translate(0, 4.25, 0), lampP, new THREE.Matrix4().makeTranslation(x, 0, 14.6));
  }
  // distant shore across the harbour (Charlestown), low and hazy
  b.add(boxGeo(V(-500, -1.6, -330), V(500, 3, -300)), lam("farShore", () => ({ color: "#8fa06e" })));
  for (let i = 0; i < 26; i++) {
    const x = -420 + i * 34 + r() * 10;
    b.add(boxGeo(V(x, 3, -318), V(x + 14 + r() * 10, 8 + r() * 10, -306)), lam("farBlk" + (i % 3), () => ({ color: ["#b98a6a", "#c9a27c", "#a8765a"][i % 3] })));
  }
  b.build(root);
  void kit; void tri; void roofHD; void prop; void TANK;
  setSight([]);
};
