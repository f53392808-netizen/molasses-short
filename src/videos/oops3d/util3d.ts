// shared helpers for the ep01 3D world (materials, canvas textures, boxes, seeded random)
import * as THREE from "three";
import { twoTone } from "../molasses/shade";
const mats = new Map<string, THREE.Material>();
export const M = (col: string, map?: THREE.Texture | null, side: THREE.Side = THREE.FrontSide, vc = false) => {
  const k = col + (map ? map.uuid : "") + side + vc;
  let m = mats.get(k);
  if (!m) { m = twoTone(new THREE.MeshLambertMaterial({ color: col, map: map ?? null, side, vertexColors: vc })); mats.set(k, m); }
  return m;
};
export const flat = (col: string) => { const k = "flat" + col; let m = mats.get(k); if (!m) { m = new THREE.MeshBasicMaterial({ color: col, fog: false }); mats.set(k, m); } return m; };
export const cv = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
export const rnd = (s: number) => { const x = Math.sin(s * 91.37 + 7.1) * 43758.5453; return x - Math.floor(x); };
export const mkBox = (R: THREE.Object3D) => (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: THREE.Material | THREE.Material[], cast = true, parent: THREE.Object3D = R) => {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = true; parent.add(o); return o;
};
export type BoxFn = ReturnType<typeof mkBox>;
/** canvas text helper */
export const txt = (g: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, col: string, align: CanvasTextAlign = "left", font = "Mont, sans-serif", w = 900) => {
  g.fillStyle = col; g.font = `${w} ${px}px ${font}`; g.textAlign = align; g.textBaseline = "alphabetic"; g.fillText(s, x, y);
};
