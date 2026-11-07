// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, KID, SKINS, fxBurst, fxCreak, fxShadow, fxContact, Outfit, Expr, FrontOpts, SideOpts } from "./toon";
import { FPS, SHOTS, V3, smooth, clamp01, TANK, TANK_R, KITCHEN, OFFICE, SIGN_T, STAMP_T, RIVETS, CRACK0, BURST, PAINT0, PAINT1, baseH, floodAt } from "./story";
import { horseSide, fxDrip, fxPuddle, fxCrack, fxSquirt, fxSpray, fxSmell, fxSeal, fxSign, fxFrost, fxSteam, fxMolSplash } from "./fx";
import { LIGHTS } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing" | "wide"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const SWAPS: Record<number, number[]> = {};
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- our 1919 cast ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
/** wide card for the horse: 1200 x 1000 design units, soles at y = 975 */
export const WIDE = (() => { const g = new THREE.PlaneGeometry(1200 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();

const COATS = ["#3f4a5e", "#5a4636", "#2f5f6a", "#6b4a3a", "#3b3f52", "#556a3f", "#7a3f3a"];
const DRESS = ["#5a8fc2", "#8c3b4a", "#d9a441", "#6a5a8a", "#3f6f5a"];
/** men in flat caps or bare heads with hair, women with hair and a long dress, kids in caps */
const folk = (v: number): Outfit => {
  const skin = SKINS[v % 4];
  if (v % 5 === 2) return { ...KID, jacket: ["#f08a2c", "#3f6fb5", "#c94a3a"][v % 3], skin };
  if (v % 3 === 1) return { jacket: COATS[(v + 3) % 7], pants: "#3b3f52", boots: "#4a3426", skin, hat: "hair", hair: ["#5a3b2a", "#2a201a", "#8a5a34"][v % 3], dress: DRESS[v % 5] };
  return { jacket: COATS[v % 7], pants: ["#3b3f52", "#4a4038", "#2f3540"][v % 3], boots: "#2f2420", skin, hat: v % 2 ? "cap" : "hair", cap: ["#4a4038", "#5a5a62", "#3a3f4a"][v % 3],
    hair: "#3a2a20", moustache: v % 4 === 0 ? "#4a3426" : undefined };
};
const SAILOR: Outfit = { jacket: "#2b3a67", pants: "#2b3a67", boots: "#1e1e24", hat: "cap", cap: "#f2f2f2", buttons: "#e8c45a", skin: SKINS[1] };
const ENGINEER: Outfit = { jacket: "#4a4f5e", pants: "#3b3f52", boots: "#2f2420", hat: "hair", hair: "#6a6a6a", moustache: "#5a5a5a", skin: SKINS[0], build: "stout" };
const WORKER = (v: number): Outfit => ({ jacket: ["#7a5a3a", "#4f5d56"][v % 2], pants: "#3b3f52", boots: "#2f2420", hat: "cap", cap: "#3a3f4a", skin: SKINS[(v + 1) % 4] });
const isKid = (o: Outfit) => o.build === "kid";

/** stroller along a line (x0 at t0, speed sp along +x or -x) */
const walker = (cam: CamInfo, t: number, out: Stage, i: number, x0: number, z: number, sp: number, o: Outfit, t0 = 0, y = 0) => {
  const x = x0 + sp * (t - t0), kid = isKid(o), sc = kid ? 0.72 : 1;
  const phase = q((((t - t0) * Math.abs(sp)) / 1.4 + hh(i, 5)) % 1, 120);
  const view = viewOf(cam, x, z, Math.sign(sp), 0);
  const expr: Expr = (["smile", "neutral", "smile_closed", "smile"] as Expr[])[i % 4];
  const fo: FrontOpts = { mode: "stroll", phase, expr, blink: lidAt(t, i), look: 0 };
  const so: SideOpts = { mode: "march", phase, expr, stomp: 0.55, stride: 0.875 * view.fs, blink: lidAt(t, i) };
  out.places.push(person(cam, { i, o, okey: `w${i}` }, x, y, z, view, fo, so, sc));
  blob(out, x, y, z, sc);
};

/** a horse (wide card, side view) at x, y, z walking along dx (sign), mirrored when it walks toward screen left */
const horse = (cam: CamInfo, t: number, out: Stage, x: number, y: number, z: number, dx: number, strain: number, i = 300) => {
  const mirror = dx * cam.right.x < 0;
  const lid = lidAt(t, i);
  const d = cam.pos.distanceTo(tmp.set(x, y + 1, z));
  const [w, h, k] = d < 6 ? [1440, 1200, 1.2] : d < 16 ? [720, 600, 0.6] : [360, 300, 0.3];
  out.places.push({ key: `horse|${q(strain, 20)}|${lid}|${w}`, geo: "wide", x, y, z, mirror, size: [w, h, k],
    draw: (p) => horseSide(p, { strain, lid }) });
};

/** the busy street on a warm January day (shot 2) + a horse and wagon */
export const WAGON = { x0: -36, z: 8.0, sp: 1.5, t0: 7.8 };
const street = (cam: CamInfo, t: number, out: Stage) => {
  // 1919: people walk in the street itself as much as on the sidewalks
  for (let i = 0; i < 20; i++) {
    const z = [1.2, 4.6, 6.0, 9.6, 12.8, 14.6][i % 6] + (hh(i, 2) - 0.5) * 0.8, sp = (hh(i, 3) < 0.5 ? -1 : 1) * (0.9 + hh(i, 4) * 0.5);
    walker(cam, t, out, i, -42 + i * 1.6 + hh(i, 6) * 2, z, sp, folk(i), 8);
  }
  horse(cam, t, out, WAGON.x0 + WAGON.sp * (t - WAGON.t0) + 2.2, 0, WAGON.z, 1, 0);
};
/** kids filling pails at the leaking base (shot 4) */
export const tankFrontZ = (x: number) => TANK[2] + Math.sqrt(Math.max(0, TANK_R * TANK_R - (x - TANK[0]) ** 2));
const KIDS: [number, number][] = [[-1.35, 0.95], [0.75, 1.05], [2.5, 1.2]];
export const DRIPS: number[] = [-1.1, 0.95, 2.75];
const kids = (cam: CamInfo, t: number, out: Stage) => {
  KIDS.forEach(([x, dz], i) => {
    const z = tankFrontZ(x) + dz, o = { ...KID, jacket: ["#f08a2c", "#3f6fb5", "#c94a3a"][i], skin: SKINS[(i + 1) % 4] };
    const expr: Expr = (["smile_closed", "grin", "smile"] as Expr[])[i];
    out.places.push(person(cam, { i: 400 + i, o, okey: `kid${i}` }, x, 0, z, { side: false, mirror: false },
      { mode: "stand", expr, prop: "pail", blink: lidAt(t, 400 + i), facing: i === 1 ? -1 : 0 }, {}, 0.72));
    blob(out, x, 0, z, 0.72);
  });
  dripsFx(t, out, 1);
};
const dripsFx = (t: number, out: Stage, alpha: number) => {
  if (alpha <= 0) return;
  DRIPS.forEach((x, i) => {
    const z = tankFrontZ(x) + 0.06, u = q(((t * 0.8 + hh(i, 2)) % 1), 30);
    out.fx.push({ key: `drip${u}`, cw: 120, ch: 600, draw: (p) => fxDrip(p, u), x, y: 1.0, z, w: 0.14, h: 0.7 });
    out.fx.push({ key: "puddle", cw: 300, ch: 150, draw: fxPuddle, x, y: 0.02, z: z + 0.35, w: 0.9, h: 0.45, flat: true });
  });
};
/** painter on the scaffold plank that comes down with the paint line (shot 5) */
export const paintY = (tau: number) => 15.2 - 14.6 * smooth((tau - PAINT0) / (PAINT1 - PAINT0));
const painter = (cam: CamInfo, t: number, out: Stage) => {
  const y = paintY(t) - 0.15, x = 1.6, z = tankFrontZ(x) + 0.75;
  out.places.push(person(cam, { i: 450, o: WORKER(0), okey: "painter" }, x, y, z, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", wave: q(Math.sin(t * 7), 20), blink: lidAt(t, 450), facing: -1 }, {}));
};
/** settled molasses depth at (x, z) */
export const molDepth = (x: number, z: number, level = 1) => {
  const r = Math.hypot(x - TANK[0], z - TANK[2]);
  return baseH(600, r) * level;
};
const stuckPerson = (cam: CamInfo, t: number, out: Stage, i: number, x: number, z: number, o: Outfit, expr: Expr, reach: boolean, sink = 1.0) => {
  const y = molDepth(x, z) - sink + 0.02 * Math.sin(t * 1.3 + i);
  out.places.push(person(cam, { i, o, okey: `st${i}` }, x, y, z, { side: false, mirror: false },
    { mode: "stand", expr, wave: reach ? q(0.3 * Math.sin(t * 1.1 + i), 20) : undefined, blink: lidAt(t, i), facing: (i % 3) - 1 as -1 | 0 | 1 }, {}, isKid(o) ? 0.72 : 1));
};
const horseShot = (cam: CamInfo, t: number, out: Stage) => {
  horse(cam, t, out, -28.6, molDepth(-28.6, 9.4) - 0.95, 9.4, -1, 0.6 + 0.4 * Math.sin(t * 1.7));
  stuckPerson(cam, t, out, 520, -35.5, 6.6, folk(4), "nervous", true);
  stuckPerson(cam, t, out, 521, -24.8, 12.0, folk(7), "pained", false);
};
const stuck = (cam: CamInfo, t: number, out: Stage) => {
  stuckPerson(cam, t, out, 600, -15.4, 7.8, folk(3), "nervous", true);
  stuckPerson(cam, t, out, 601, -13.0, 7.0, folk(1), "pained", false);
  stuckPerson(cam, t, out, 602, -17.2, 9.6, folk(6), "nervous", false);
  stuckPerson(cam, t, out, 603, -12.2, 10.2, folk(9), "pained", true);
  // rescuers wading in from the near side, knee-deep, reaching
  for (const [i, x, z] of [[610, -9.9, 6.6], [611, -10.6, 9.0]] as const) {
    const y = molDepth(x, z) - 0.45;
    out.places.push(person(cam, { i, o: SAILOR, okey: `sail${i}` }, x, y, z, { side: false, mirror: false },
      { mode: "stand", expr: "stern", wave: q(0.5 + 0.3 * Math.sin(t * 1.4 + i), 20), blink: lidAt(t, i), facing: -1 }, {}));
  }
};
/** the engineer behind the desk; strike k: 0 raised .. 1 down on the plan */
export const stampK = (t: number) => {
  const n = (t - STAMP_T) * FPS;
  return n < -10 ? 0.15 : n < -3 ? smooth((n + 10) / 7) : n < 10 ? 1 : 1 - smooth((n - 10) / 8);
};
const office = (cam: CamInfo, t: number, out: Stage) => {
  const O = OFFICE;
  out.places.push(person(cam, { i: 700, o: ENGINEER, okey: "eng" }, O[0] - 0.25, 0, O[2] - 0.62, { side: false, mirror: false },
    { mode: "stand", expr: t < STAMP_T - 0.1 ? "stern" : "neutral", prop: ["stamp", q(stampK(t), 30)], blink: lidAt(t, 700), facing: 1 }, {}));
  // signature + seal on the blueprint (flat on the desk top, y 0.82)
  const u = clamp01((t - SIGN_T + 0.1) / 0.6);
  if (u > 0) out.fx.push({ key: `sign${q(u, 30)}`, cw: 600, ch: 200, draw: (p) => fxSign(p, q(u, 30)), x: O[0] + 0.22, y: 0.826, z: O[2] + 0.22, w: 0.42, h: 0.14, flat: true });
  if (t >= STAMP_T) out.fx.push({ key: "seal", cw: 300, ch: 300, draw: fxSeal, x: O[0] - 0.2, y: 0.827, z: O[2] + 0.12, w: 0.2, h: 0.2, flat: true });
  if (t >= STAMP_T && t < STAMP_T + 0.25) {
    const k2 = (t - STAMP_T) / 0.25;
    out.fx.push({ key: `burst${q(k2, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(k2, 30), "#fff3b0", 10, 40, 230), x: O[0] - 0.2, y: 0.9, z: O[2] + 0.12, w: 0.45, h: 0.45 });
  }
};
/** crews hosing the street with harbour water (shot 15) */
export const NOZZLE: V3 = [7.4, 1.15, -6.0];
const hose = (cam: CamInfo, t: number, out: Stage) => {
  for (const [i, x, z] of [[800, 8.4, -5.4], [801, 9.9, -4.7]] as const) {
    const y = molDepth(x, z, 0.4) * 0 ;
    out.places.push(person(cam, { i, o: WORKER(i), okey: `wk${i}` }, x, y, z, { side: false, mirror: false },
      { mode: "stand", expr: "stern", wave: q(-0.2 + 0.1 * Math.sin(t * 2 + i), 20), blink: lidAt(t, i), facing: -1 }, {}));
    blob(out, x, y, z);
  }
  const u = q((t * 1.7) % 1, 20);
  out.fx.push({ key: `spray${u}`, cw: 1000, ch: 500, draw: (p) => fxSpray(p, u), x: NOZZLE[0] - 3.6, y: NOZZLE[1] + 0.2, z: NOZZLE[2] - 3.2, w: 8.4, h: 4.2, soft: true, rot: 0 });
  // fireboat jet in the harbour
  out.fx.push({ key: `spray${u}`, cw: 1000, ch: 500, draw: (p) => fxSpray(p, u), x: 2, y: 6, z: -40, w: 18, h: 9, soft: true });
};
/** summer evening, decades later: strollers and one person who stops to sniff (shot 16) */
const SNIFF: V3 = [-20.4, 0, 9.2];
const summer = (cam: CamInfo, t: number, out: Stage) => {
  for (let i = 0; i < 12; i++) {
    const side = i % 2, z = side ? 14.3 + hh(i, 2) * 0.5 : 1.0 + hh(i, 2) * 0.5, sp = (hh(i, 3) < 0.5 ? -1 : 1) * (0.8 + hh(i, 4) * 0.4);
    walker(cam, t, out, 900 + i, -46 + i * 3.4, z, sp, folk(i + 20), 58);
  }
  const sniffK = smooth((t - 59.3) / 0.5);
  out.places.push(person(cam, { i: 950, o: folk(1), okey: "sniffer" }, SNIFF[0], 0, SNIFF[2], { side: false, mirror: false },
    { mode: "stand", expr: t > 59.3 ? "smile_closed" : "smile", headTilt: q(-6 * sniffK, 10), blink: lidAt(t, 950), facing: 1 }, {}));
  blob(out, SNIFF[0], 0, SNIFF[2]);
  if (sniffK > 0.05) {
    const u = q((t * 0.9) % 1, 30);
    out.fx.push({ key: `smell${u}`, cw: 400, ch: 500, draw: (p) => fxSmell(p, u), x: SNIFF[0] + 0.3, y: 1.75, z: SNIFF[2] + 0.2, w: 0.45 * sniffK, h: 0.56 * sniffK, soft: false });
  }
};
const kitchen = (cam: CamInfo, t: number, out: Stage) => {
  const K = KITCHEN, u = q((t * 0.8) % 1, 20);
  out.fx.push({ key: `steam${u}`, cw: 300, ch: 400, draw: (p) => fxSteam(p, u), x: K[0] - 0.5, y: 1.35, z: K[2] + 0.05, w: 0.3, h: 0.4, soft: true });
  out.fx.push({ key: `frost${u}`, cw: 300, ch: 300, draw: (p) => fxFrost(p, u), x: K[0] + 0.55, y: 1.08, z: K[2] + 0.12, w: 0.3, h: 0.3 });
};

/** everything with a face (and the 2D effects) in shot id at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.crowd) {
    case "street": street(cam, t, out); break;
    case "kids": kids(cam, t, out); break;
    case "painter": painter(cam, t, out); dripsFx(t, out, t < PAINT0 + 0.6 ? 1 : 0); break;
    case "horse": horseShot(cam, t, out); break;
    case "stuck": stuck(cam, t, out); break;
    case "office": office(cam, t, out); break;
    case "hose": hose(cam, t, out); break;
    case "summer": summer(cam, t, out); break;
    case "kitchen": kitchen(cam, t, out); break;
    default: break;
  }
  if (id === 3) dripsFx(t, out, 1);
  if (id === 6 && t > 23.5) creakFx(t, [[TANK[0] + 4, 9, tankFrontZ(4) + 0.6], [TANK[0] - 3, 5, tankFrontZ(-3) + 0.6], [TANK[0] + 1, 12.5, tankFrontZ(1) + 0.6]], out, 1.2);
  if (id === 7) seamFx(t, out);
  if (id === 8) waveFx(t, out);
  void floodAt; void BURST;
  return out;
};

// ---------------- one-off effects ----------------
/** rivet pops (bursts on the seam), the crack and the first squirt (shot 7) */
export const SEAM: V3 = [TANK[0] + 0.9, 2.7, 0]; // x, y of the seam centre; z from tankFrontZ
const seamFx = (t: number, out: Stage) => {
  RIVETS.forEach((tr, i) => {
    if (t >= tr && t < tr + 0.3) {
      const u = (t - tr) / 0.3, x = SEAM[0] - 0.6 + i * 0.32, y = 1.7 + (i % 3) * 0.55;
      out.fx.push({ key: `burst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30)), x, y, z: tankFrontZ(x) + 0.12, w: 0.55, h: 0.55 });
    }
  });
  if (t > 24.9) creakFx(t, [[SEAM[0] - 0.8, 3.6, tankFrontZ(SEAM[0] - 0.8) + 0.3], [SEAM[0] + 0.9, 2.2, tankFrontZ(SEAM[0] + 0.9) + 0.3]], out, 0.5);
  const u = clamp01((t - CRACK0) / (BURST - CRACK0));
  if (u > 0) {
    const x = SEAM[0];
    out.fx.push({ key: `crack${q(u, 30)}`, cw: 300, ch: 900, draw: (p) => fxCrack(p, q(u, 30)), x, y: 3.6, z: tankFrontZ(x) + 0.05, w: 1.0, h: 3.0 });
    if (u > 0.5) {
      const k = q(clamp01((u - 0.5) / 0.5), 30);
      out.fx.push({ key: `squirt${k}`, cw: 600, ch: 400, draw: (p) => fxSquirt(p, k), x: x + 0.9, y: 1.8, z: tankFrontZ(x) + 0.4, w: 2.2, h: 1.5 });
    }
  }
};
/** brown splash crowns: the firehouse corner and the el column the wave slams into (shot 8) */
const waveFx = (t: number, out: Stage) => {
  for (const [t0, x, y, z, s] of [[31.1, 52.5, 1.6, -2.5, 6], [33.0, -80, 2.4, 3, 7], [33.05, -80, 2.4, 11, 6]] as const) {
    const u = (t - t0) / 1.0;
    if (u >= 0 && u < 1) out.fx.push({ key: `msplash${q(u, 30)}`, cw: 800, ch: 800, draw: (p) => fxMolSplash(p, q(u, 30)), x, y, z, w: s, h: s });
  }
};
export const creakFx = (t: number, pts: V3[], out: Stage, size = 0.8) =>
  pts.forEach(([x, y, z], i) => {
    const u = q((t * 1.3 + i * 0.37) % 1, 30);
    out.fx.push({ key: `creak${u}`, cw: 300, ch: 300, draw: (p) => fxCreak(p, u), x, y, z, w: size, h: size, rot: i * 0.6 - 0.6 });
  });
export { FPS };
