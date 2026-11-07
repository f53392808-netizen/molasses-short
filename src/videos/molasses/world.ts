// The whole place as one three.js scene: sky, harbour, wharf, Commercial Street under the elevated railway, the
// North End blocks (town.ts), the molasses tank (grey -> painted brown -> split -> wreck), the firehouse, the ship,
// the flood (a radial heightfield rebuilt every frame from story.ts), two small inserts far outside the town (a
// kitchen for the honey analogy, an engineer's desk) and the cast. update(id, f, camera) poses everything for
// shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit, Ray, kitClone, prop } from "./build";
import { ctex, rep, cobbleHD, stoneHD, planksHD, grassHD, waterNear, waterFar, cloudHD, brick } from "./paint";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage, WIDE, WAGON, paintY, molDepth, tankFrontZ, SEAM, NOZZLE, stampK } from "./cast";
import { buildNorthEnd, elBent } from "./town";
import {
  FPS, SHOTS, camAt, V3, ShotDef, QUAY, WATER_Y, TANK, TANK_R, TANK_H, EL_Y, EL_HIT_X, FIREHOUSE, KITCHEN, OFFICE,
  floodAt, tankAt, frontR, crestH, baseH, smooth, clamp01, RIVETS, Flood,
} from "./story";

// ---------------- assets: no Kenney GLBs in this project (all props are procedural) ----------------
let kitP: Promise<Kit> | null = null;
export const loadKit = () => { if (!kitP) kitP = Promise.resolve({} as Kit); return kitP; };

/** per-shot sun override (camera-relative az / el) */
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 1: { az: 150, el: 40 }, 8: { az: 150, el: 40 }, 2: { az: 110 }, 9: { az: 120 }, 11: { az: 55, el: 40 }, 13: { az: 110, el: 35 }, 14: { az: 50, el: 42 } };

const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, Math.min(f, 1889))), o = V(...c.pos), look = V(...c.look);
    if (Math.abs(o.x) > 500) continue; // the inserts far outside the town
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

// ---------------- painted textures specific to this short ----------------
const plateTex = (key: string, base: string, seam: string, streaks: boolean) => ctex(key, 1024, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 40; i++) { // soft mottling
    const x = r() * 1024, y = r() * 512, rad = 20 + r() * 60, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, r() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
  }
  // 6 plate rows (2.5 m each over 15.2 m -> the texture spans the full height), 12 plate columns per 1024 px
  for (let row = 0; row <= 6; row++) { const y = (row / 6) * 512; g.fillStyle = seam; g.fillRect(0, y - 2, 1024, 4); for (let x = 6; x < 1024; x += 12) { g.fillStyle = seam; g.beginPath(); g.arc(x, y + 7, 2.2, 0, 7); g.fill(); } }
  for (let c = 0; c < 12; c++) { const x = (c / 12) * 1024 + ((c % 2) * 20); g.fillStyle = seam; g.fillRect(x - 2, 0, 4, 512); for (let y = 6; y < 512; y += 12) { g.beginPath(); g.arc(x + 7, y, 2.2, 0, 7); g.fill(); } }
  if (streaks) for (let i = 0; i < 26; i++) { // brown leak streaks running down from the seams
    const x = r() * 1024, y0 = Math.floor(r() * 6) * (512 / 6), len = 40 + r() * 160, w = 3 + r() * 6;
    const gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, "rgba(92,44,16,0.95)"); gr.addColorStop(1, "rgba(92,44,16,0)");
    g.fillStyle = gr; g.fillRect(x, y0, w, len);
  }
});
const fireFront = () => ctex("fireFront", 1024, 768, (g, r) => {
  g.fillStyle = "#e9d3b4"; g.fillRect(0, 0, 1024, 768);
  for (let y = 0, row = 0; y < 768; y += 12, row++) for (let x = -(row % 2) * 18; x < 1024; x += 36) { g.fillStyle = ["#b5543c", "#a94a33", "#c0583a"][Math.floor(r() * 3)]; g.fillRect(x + 1, y + 1, 34, 10); }
  for (const cx of [300, 724]) { // two arched engine doors
    g.fillStyle = "#efe3c8"; g.beginPath(); g.moveTo(cx - 150, 768); g.lineTo(cx - 150, 430); g.arc(cx, 430, 150, Math.PI, 0); g.lineTo(cx + 150, 768); g.fill();
    g.fillStyle = "#b8302a"; g.beginPath(); g.moveTo(cx - 128, 768); g.lineTo(cx - 128, 436); g.arc(cx, 436, 128, Math.PI, 0); g.lineTo(cx + 128, 768); g.fill();
    g.strokeStyle = "rgba(40,20,20,0.6)"; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, 330); g.lineTo(cx, 768); g.stroke();
    for (let y = 470; y < 760; y += 70) { g.beginPath(); g.moveTo(cx - 128, y); g.lineTo(cx + 128, y); g.stroke(); }
    g.fillStyle = "#8d9cdb"; for (const dx of [-80, -30, 30, 80]) g.fillRect(cx + dx - 18, 380, 36, 50);
  }
  for (const cx of [150, 512, 874]) { g.fillStyle = "#efe3c8"; g.fillRect(cx - 50, 70, 100, 140); g.fillStyle = "#6670b0"; g.fillRect(cx - 40, 80, 80, 120); }
  g.fillStyle = "#efe3c8"; g.fillRect(0, 0, 1024, 26); g.fillRect(0, 250, 1024, 18);
});
const carTex = () => ctex("elCar", 1024, 256, (g) => {
  g.fillStyle = "#a94a33"; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = "#e9c46a"; g.fillRect(0, 196, 1024, 14);
  for (let x = 40; x < 1000; x += 80) { g.fillStyle = "#efe3c8"; g.fillRect(x - 4, 56, 58, 92); g.fillStyle = "#6670b0"; g.fillRect(x, 60, 50, 84); }
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, 0, 1024, 10);
});
const paperTex = () => ctex("blueprint", 1024, 640, (g) => {
  g.fillStyle = "#2f5fa8"; g.fillRect(0, 0, 1024, 640);
  g.strokeStyle = "rgba(255,255,255,0.18)"; g.lineWidth = 1;
  for (let x = 0; x < 1024; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 640); g.stroke(); }
  for (let y = 0; y < 640; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  g.strokeStyle = "#f4f6fb"; g.lineWidth = 5;
  g.beginPath(); g.arc(330, 320, 190, 0, Math.PI * 2); g.stroke(); // tank plan
  g.beginPath(); g.arc(330, 320, 160, 0, Math.PI * 2); g.stroke();
  g.strokeRect(600, 140, 330, 360); // elevation
  for (let y = 200; y < 500; y += 60) { g.beginPath(); g.moveTo(600, y); g.lineTo(930, y); g.stroke(); }
  g.lineWidth = 3; g.beginPath(); g.moveTo(140, 560); g.lineTo(520, 560); g.moveTo(140, 545); g.lineTo(140, 575); g.moveTo(520, 545); g.lineTo(520, 575); g.stroke();
  g.beginPath(); g.moveTo(960, 140); g.lineTo(960, 500); g.stroke();
  g.strokeRect(12, 12, 1000, 616);
});
const wallpaper = (key: string, a: string, b: string) => ctex(key, 256, 256, (g) => {
  g.fillStyle = a; g.fillRect(0, 0, 256, 256);
  g.fillStyle = b; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 22, 256);
});

type Mats = Record<string, THREE.Material>;
const yGround = (z: number) => (z < QUAY ? WATER_Y + 0.05 : 0);

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private wides: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  // dynamic pieces
  private tank = new THREE.Group(); private tankWall: THREE.Mesh; private tankBrown: THREE.Mesh; private tankRoof: THREE.Mesh;
  private brownTex: THREE.Texture; private wreck = new THREE.Group(); private rivets: THREE.InstancedMesh; private rivetPos: THREE.Vector3[] = [];
  private fire = new THREE.Group(); private hitBent = new THREE.Group(); private train = new THREE.Group(); private wagon = new THREE.Group();
  private ship = new THREE.Group(); private fireboat = new THREE.Group(); private plank = new THREE.Group(); private hose: THREE.Mesh;
  private summer = new THREE.Group(); private stamp = new THREE.Group(); private crates: THREE.Mesh[] = [];
  private flood: THREE.Mesh; private floodGeo: THREE.BufferGeometry; private floodMat: THREE.MeshPhongMaterial;
  private NR = 64; private NA = 180;

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
    // ---- sky + light (as the bridge short) ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    const disc = ctex("sunDisc", 128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    });
    const halo = ctex("sunHalo", 256, 256, (g) => {
      const im = g.createImageData(256, 256);
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        const u = Math.hypot(x - 127.5, y - 127.5) / 128;
        const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
        const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
      }
      g.putImageData(im, 0, 0);
    });
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: disc, color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- ground, quay, harbour (static) ----
    const b = new Batch();
    M.cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    M.walk = lam("walkHD", () => ({ map: stoneHD("walkHD", ["#d6cab6", "#cfc2ad", "#ddd2bf", "#c8baa4"], "#a39584") }));
    M.wharf = lam("wharfHD", () => ({ map: planksHD() }));
    M.quay = lam("quayHD", () => ({ map: stoneHD("quayHD", ["#b9ad9b", "#ad a08e".replace(" ", ""), "#c2b6a4", "#a99c89"], "#8a7e6e") }));
    const flat = (x0: number, x1: number, z0: number, z1: number, y: number, u: number, v: number) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 1, 0]).flat(), 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
      return g;
    };
    b.add(flat(-400, 400, 0, 14, 0, 100, 1.75), M.cobble); // Commercial Street
    b.add(flat(-400, 400, 14, 16.5, 0.02, 100, 0.3), M.walk); // inland sidewalk
    b.add(flat(-400, 400, 16.5, 400, 0, 100, 48), M.cobble); // behind (side streets, yards)
    b.add(flat(-400, 400, QUAY, 0, 0, 50, 4.1), M.wharf); // wharf
    b.add(flat(-400, 400, -2.5, 0, 0.02, 100, 0.3), M.walk); // harbour-side sidewalk
    { const g = new THREE.BufferGeometry(), y0 = WATER_Y - 2, z = QUAY; // quay wall facing the harbour
      g.setAttribute("position", new THREE.Float32BufferAttribute([400, y0, z, -400, y0, z, -400, 0, z, 400, y0, z, -400, 0, z, 400, 0, z], 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 0, -1]).flat(), 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 200, 0, 200, 0.9, 0, 0, 200, 0.9, 0, 0.9], 2));
      b.add(g, M.quay); }
    b.add(boxGeo(V(-400, -0.05, QUAY - 0.5), V(400, 0.25, QUAY + 0.4)), lam("copeHD", () => ({ map: stoneHD("copeHD") })));
    // the hit bent's spans stay put; the bent itself moves (see below)
    b.build(R);
    buildNorthEnd(R, kit, sightLines());

    // harbour water (the bridge river shader)
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "harbour1";
    const wg = new THREE.PlaneGeometry(1600, 900); wg.rotateX(-Math.PI / 2); wg.translate(0, WATER_Y, QUAY - 450);
    const wm = new THREE.Mesh(wg, waterM); wm.receiveShadow = true; R.add(wm);

    // ---- the tank ----
    const greyTex = plateTex("tankGrey", "#8a929c", "rgba(40,44,52,0.55)", true); greyTex.repeat.set(4, 1);
    this.brownTex = plateTex("tankBrown", "#7a4426", "rgba(40,20,12,0.45)", false); this.brownTex.repeat.set(4, 1);
    const wallG = new THREE.CylinderGeometry(TANK_R, TANK_R, TANK_H, 96, 1, true).translate(0, TANK_H / 2, 0);
    this.tankWall = new THREE.Mesh(wallG, lam("tankGrey", () => ({ map: greyTex })));
    const brownG = new THREE.CylinderGeometry(TANK_R + 0.03, TANK_R + 0.03, 1, 96, 1, true).translate(0, -0.5, 0); // top at y = 0: scaled down from the rim
    this.tankBrown = new THREE.Mesh(brownG, lam("tankBrown", () => ({ map: this.brownTex })));
    this.tankBrown.position.y = TANK_H;
    const roofG = new THREE.ConeGeometry(TANK_R + 0.3, 1.6, 96, 1, true).translate(0, TANK_H + 0.8, 0);
    this.tankRoof = new THREE.Mesh(roofG, lam("tankRoofGrey", () => ({ color: "#7b838d" })));
    this.tank.add(this.tankWall, this.tankBrown, this.tankRoof);
    this.tank.position.set(TANK[0], 0, TANK[2]);
    this.tank.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    R.add(this.tank);
    // 3D rivet heads on the seam the close-up looks at (shot 7)
    const rivG = new THREE.SphereGeometry(0.055, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2);
    for (let row = 0; row < 3; row++) for (let k = 0; k < 22; k++) {
      const x = SEAM[0] - 2.6 + k * 0.24, y = 1.25 + row * 1.25, z = tankFrontZ(x) + 0.01;
      this.rivetPos.push(V(x, y, z));
    }
    this.rivets = new THREE.InstancedMesh(rivG, lam("rivet", () => ({ color: "#8a929c" })), this.rivetPos.length);
    this.rivets.castShadow = false; this.rivets.receiveShadow = true; this.rivets.frustumCulled = false;
    R.add(this.rivets);
    // wreck: a low jagged ring, curved plates flung around, the roof dropped and tipped
    const wb = new Batch(), plateM = lam("wreckPlate", () => ({ map: this.brownTex, side: THREE.DoubleSide }));
    wb.add(new THREE.CylinderGeometry(TANK_R, TANK_R, 1.6, 64, 1, true, 0.6, 4.6).translate(0, 0.8, 0), plateM);
    for (const [a, th, h, tilt, d] of [[0.2, 0.55, 7, 0.9, 5], [1.4, 0.5, 6, 1.1, 8], [2.6, 0.6, 8, 0.6, 3], [-0.6, 0.45, 5, 1.2, 9], [3.6, 0.5, 7, 1.0, 4], [5.0, 0.4, 6, 0.8, 6]] as const) {
      const g = new THREE.CylinderGeometry(TANK_R, TANK_R, h, 16, 1, true, a, th).translate(0, h / 2, 0);
      const m = new THREE.Matrix4().makeTranslation(Math.sin(a + th / 2) * d, 0, Math.cos(a + th / 2) * d)
        .multiply(new THREE.Matrix4().makeRotationAxis(V(Math.cos(a + th / 2), 0, -Math.sin(a + th / 2)), tilt));
      wb.add(g, plateM, m);
    }
    wb.add(new THREE.ConeGeometry(TANK_R * 0.8, 1.4, 48, 1, true), lam("tankRoofBrown", () => ({ color: "#6b3a22", side: THREE.DoubleSide })),
      new THREE.Matrix4().compose(V(-3, 1.6, -4), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, 0, 0.25)), V(1, 1, 1)));
    wb.build(this.wreck);
    this.wreck.position.set(TANK[0], 0, TANK[2]);
    R.add(this.wreck);

    // ---- firehouse (Engine 31): moves off its foundation in shot 8 ----
    { const fb = new Batch(), F = FIREHOUSE, w = 12, d = 12, h = 9;
      fb.add(boxGeo(V(-w / 2, 0, -d), V(w / 2, h, 0)), lam("fireBrick", () => ({ map: rep(brick(), 3, 2.2) })));
      const fq = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0.02);
      fb.add(fq, lam("fireFront", () => ({ map: fireFront() })));
      fb.add(boxGeo(V(-w / 2 - 0.2, h - 0.4, -d - 0.2), V(w / 2 + 0.2, h + 0.3, 0.35)), lam("trimStone", () => ({ color: "#efe3c8" })));
      fb.add(boxGeo(V(w / 2 - 3.5, h, -d), V(w / 2, h + 6, -d + 3.5)), lam("fireBrick", () => ({ map: rep(brick(), 3, 2.2) })));
      fb.add(new THREE.ConeGeometry(2.6, 2.2, 4).rotateY(Math.PI / 4).translate(w / 2 - 1.75, h + 7.1, -d + 1.75), lam("roofSlate", () => ({ color: "#5a6070" })));
      fb.build(this.fire);
      this.fire.position.set(F[0], 0, F[2] + 6); // front face on the harbour-side sidewalk (z = -2)
      R.add(this.fire); }
    // ---- the el bent the wave slams into, a two-car train, a wagon ----
    { const hb = new Batch(); elBent(hb, 0); hb.build(this.hitBent); this.hitBent.position.set(EL_HIT_X, 0, 0); R.add(this.hitBent); }
    { const tb = new Batch(), cm = lam("elCarSide", () => ({ map: carTex() })), roof = lam("elCarRoof", () => ({ color: "#5a4a4a" }));
      for (const x0 of [0, 13.6]) {
        tb.add(boxGeo(V(x0, 0.6, -1.4), V(x0 + 13, 3.4, 1.4)), cm);
        tb.add(boxGeo(V(x0 - 0.1, 3.4, -1.5), V(x0 + 13.1, 3.75, 1.5)), roof);
        for (const xb of [x0 + 2, x0 + 11]) tb.add(boxGeo(V(xb - 1, 0, -1.1), V(xb + 1, 0.6, 1.1)), lam("bogie", () => ({ color: "#2f3236" })));
      }
      tb.build(this.train); this.train.position.set(-200, EL_Y + 2.32, 7); R.add(this.train); }
    { const wg2 = new Batch(), wood = lam("wagonWood", () => ({ color: "#8a5a34" })), wheel = lam("wheel", () => ({ color: "#3a2a24" }));
      wg2.add(boxGeo(V(-1.5, 0.75, -0.65), V(1.5, 1.25, 0.65)), wood);
      for (const s of [-1, 1]) wg2.add(boxGeo(V(-1.5, 1.25, s * 0.65 - 0.05), V(1.5, 1.6, s * 0.65 + 0.05)), wood);
      for (const s of [-1, 1]) wg2.add(boxGeo(V(1.5, 0.95, s * 0.35 - 0.04), V(3.4, 1.05, s * 0.35 + 0.04)), wood);
      for (const [x, z] of [[-1.0, -0.72], [-1.0, 0.72], [1.0, -0.72], [1.0, 0.72]] as const)
        wg2.add(new THREE.CylinderGeometry(0.48, 0.48, 0.1, 18).rotateX(Math.PI / 2).translate(x, 0.48, z), wheel);
      for (let k = 0; k < 3; k++) wg2.add(new THREE.CylinderGeometry(0.33, 0.33, 0.66, 12).translate(-0.9 + k * 0.8, 1.6, 0), lam("barrel", () => ({ color: "#8a5a34" })));
      wg2.build(this.wagon); R.add(this.wagon); }
    // ---- the ship at the wharf with the pipe up to the tank top (shot 6) ----
    { const sb = new Batch(), hull = lam("hull", () => ({ color: "#2e3038" })), boot = lam("boot", () => ({ color: "#a63a2e" }));
      const sh = new THREE.Shape(); sh.moveTo(-26, -3.6); sh.lineTo(16, -3.6); sh.quadraticCurveTo(26, -3.0, 30, 0); sh.quadraticCurveTo(26, 3.0, 16, 3.6); sh.lineTo(-26, 3.6); sh.lineTo(-27, 0); sh.closePath();
      const hg = new THREE.ExtrudeGeometry(sh, { depth: 5.4, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -1.4, 0);
      sb.add(hg, hull);
      const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -1.6, 0).scale(1.005, 1, 1.01);
      sb.add(bg, boot);
      sb.add(boxGeo(V(-24, 4.0, -3.3), V(14, 4.1, 3.3)), lam("deck", () => ({ color: "#b07a48" })));
      sb.add(boxGeo(V(-22, 4.0, -2.6), V(-12, 7.2, 2.6)), lam("cabinWhite", () => ({ color: "#efe9dc" })));
      sb.add(new THREE.CylinderGeometry(1.0, 1.1, 6, 16).translate(-15, 9.5, 0), lam("funnel", () => ({ color: "#2a2a2e" })));
      sb.add(new THREE.CylinderGeometry(1.02, 1.02, 1.0, 16).translate(-15, 11.0, 0), lam("funnelBand", () => ({ color: "#c8a23a" })));
      for (const x of [-4, 18]) sb.add(new THREE.CylinderGeometry(0.15, 0.2, 14, 8).translate(x, 11, 0), lam("mast", () => ({ color: "#6e4a30" })));
      sb.build(this.ship);
      this.ship.position.set(4, WATER_Y, -41.5);
      const path = new THREE.CatmullRomCurve3([V(6, WATER_Y + 4.3, -41.5), V(6, 3.5, -36.5), V(4.5, 9, -33.0), V(3.5, 15.8, -30.6), V(2.5, 16.3, -27)]);
      const pipe = new THREE.Mesh(new THREE.TubeGeometry(path, 40, 0.28, 10), lam("pipe", () => ({ color: "#3a3f4a" })));
      pipe.castShadow = true; pipe.position.set(-this.ship.position.x, -this.ship.position.y, -this.ship.position.z); this.ship.add(pipe);
      R.add(this.ship); }
    // ---- fireboat for the cleanup (shot 15) ----
    { const fb = new Batch();
      fb.add(boxGeo(V(-8, -1.0, -2.2), V(8, 1.4, 2.2)), lam("fbHull", () => ({ color: "#a63a2e" })));
      fb.add(boxGeo(V(-5, 1.4, -1.6), V(1, 3.6, 1.6)), lam("cabinWhite", () => ({ color: "#efe9dc" })));
      fb.add(new THREE.CylinderGeometry(0.5, 0.55, 2.6, 12).translate(-2.5, 4.9, 0), lam("funnel", () => ({ color: "#2a2a2e" })));
      fb.add(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8).rotateZ(-0.9).translate(4.5, 2.2, 0), lam("pipe", () => ({ color: "#3a3f4a" })));
      fb.build(this.fireboat); this.fireboat.position.set(-6, WATER_Y, -41); R.add(this.fireboat); }
    // ---- painter's scaffold plank (shot 5) ----
    { const pb = new Batch(), x = 1.6, z = tankFrontZ(1.6) + 0.75;
      pb.add(boxGeo(V(x - 2.2, -0.1, z - 0.35), V(x + 2.2, 0, z + 0.35)), lam("wagonWood", () => ({ color: "#8a5a34" })));
      for (const s of [-1, 1]) pb.add(new THREE.CylinderGeometry(0.02, 0.02, 16, 5).translate(x + s * 1.9, 8, z), lam("rope", () => ({ color: "#d9c79a" })));
      pb.build(this.plank); R.add(this.plank); }
    // ---- cleanup hose from the quay to the nozzle (shot 15) ----
    { const path = new THREE.CatmullRomCurve3([V(...NOZZLE), V(NOZZLE[0] + 1.2, 0.9, NOZZLE[2] + 0.7), V(NOZZLE[0] + 2.6, 0.1, NOZZLE[2] + 1.1), V(14, 0.08, -12), V(10, 0.08, -26), V(6, 0.1, QUAY + 0.5)]);
      this.hose = new THREE.Mesh(new THREE.TubeGeometry(path, 60, 0.07, 8), lam("hoseCanvas", () => ({ color: "#c9b38a" })));
      this.hose.castShadow = true; R.add(this.hose); }
    // ---- crates riding the wave (shots 1, 8) ----
    for (let i = 0; i < 7; i++) {
      const s = 0.7 + (i % 3) * 0.25;
      const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), lam("crate", () => ({ color: "#b07a48" })));
      m.castShadow = true; this.crates.push(m); R.add(m);
    }
    // ---- summer: a grassy lot where the tank stood, trees (shot 16) ----
    { const gb = new Batch();
      const disc = new THREE.CircleGeometry(TANK_R + 4, 48).rotateX(-Math.PI / 2).translate(TANK[0], 0.03, TANK[2]);
      gb.add(disc, lam("grassHD", () => ({ map: grassHD() })));
      for (const [x, z, h] of [[-8, -8, 7], [6, -6, 8], [-2, -24, 7.5], [12, -18, 6.5], [-14, -18, 8]] as const) prop(gb, kit, "tree_oak", x, 0, z, h, x);
      gb.build(this.summer); R.add(this.summer); }
    // ---- inserts: kitchen (honey) and the engineer's office ----
    this.buildKitchen(R); this.buildOffice(R);

    // ---- the flood: a radial heightfield around the tank ----
    const NR = this.NR, NA = this.NA, n = NR * (NA + 1);
    this.floodGeo = new THREE.BufferGeometry();
    this.floodGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.floodGeo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    const idx: number[] = [];
    for (let i = 0; i < NR - 1; i++) for (let j = 0; j < NA; j++) {
      const a = i * (NA + 1) + j, c = a + 1, d = a + NA + 1, e = d + 1;
      idx.push(a, d, c, c, d, e);
    }
    this.floodGeo.setIndex(idx);
    this.floodMat = twoTone(new THREE.MeshPhongMaterial({ color: "#6e3614", specular: "#a8673a", shininess: 38, side: THREE.DoubleSide }), 2.2);
    this.flood = new THREE.Mesh(this.floodGeo, this.floodMat);
    this.flood.castShadow = true; this.flood.receiveShadow = true; this.flood.frustumCulled = false;
    R.add(this.flood);
  }

  private kitchenHoney: THREE.Mesh[] = [];
  private buildKitchen(R: THREE.Object3D) {
    const K = KITCHEN, kb = new Batch();
    kb.add(boxGeo(V(K[0] - 4, -0.1, K[2] - 1.6), V(K[0] + 4, 0, K[2] + 4)), lam("kFloor", () => ({ map: rep(planksHD(), 1, 1) })));
    kb.add(boxGeo(V(K[0] - 4, 0, K[2] - 1.7), V(K[0] + 4, 3.2, K[2] - 1.5)), lam("kWall", () => ({ map: rep(wallpaper("kWallT", "#f3e3c6", "#ead2a8"), 8, 1) })));
    kb.add(boxGeo(V(K[0] - 1.25, 0.76, K[2] - 0.6), V(K[0] + 1.25, 0.82, K[2] + 0.6)), lam("tableTop", () => ({ color: "#b07a48" })));
    for (const [x, z] of [[-1.15, -0.5], [1.15, -0.5], [-1.15, 0.5], [1.15, 0.5]] as const) kb.add(boxGeo(V(K[0] + x - 0.05, 0, K[2] + z - 0.05), V(K[0] + x + 0.05, 0.76, K[2] + z + 0.05)), lam("tableTop", () => ({ color: "#b07a48" })));
    kb.add(boxGeo(V(K[0] - 1.25, 0.82, K[2] - 0.6), V(K[0] + 1.25, 0.825, K[2] + 0.6)), lam("cloth", () => ({ map: rep(wallpaper("checkT", "#ffffff", "#d8e6f3"), 6, 3) })));
    // the fridge behind the right jar
    kb.add(boxGeo(V(K[0] + 1.6, 0, K[2] - 1.45), V(K[0] + 2.5, 1.85, K[2] - 0.65)), lam("fridge", () => ({ color: "#eef2f4" })));
    kb.add(boxGeo(V(K[0] + 1.62, 1.2, K[2] - 0.64), V(K[0] + 1.68, 1.6, K[2] - 0.6)), lam("handle", () => ({ color: "#9aa3ad" })));
    // jars + dippers: left warm, right cold
    for (const [dx, tag] of [[-0.5, "warm"], [0.55, "cold"]] as const) {
      kb.add(new THREE.CylinderGeometry(0.11, 0.1, 0.2, 24).translate(K[0] + dx, 0.925, K[2]), lam("jar", () => ({ color: "#e9a43a" })));
      kb.add(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 20).translate(K[0] + dx, 1.04, K[2]), lam("jarLid", () => ({ color: tag === "warm" ? "#d8b45a" : "#cfe3ee" })));
      const hx = K[0] + dx, top = tag === "warm" ? 1.32 : 1.2;
      kb.add(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8).rotateZ(-0.5).translate(hx + 0.1, top + 0.17, K[2]), lam("dipper", () => ({ color: "#a8744a" })));
      for (let k = 0; k < 4; k++) kb.add(new THREE.CylinderGeometry(0.035 - k * 0.004, 0.035 - k * 0.004, 0.018, 14).translate(hx, top - 0.03 + k * 0.03, K[2]), lam("dipper", () => ({ color: "#a8744a" })));
    }
    kb.build(R);
    const honeyM = twoTone(new THREE.MeshPhongMaterial({ color: "#e0921e", specular: "#ffe2a0", shininess: 60 }), 0.4);
    // warm: a long thin stream from the dipper into the jar, with a coil on the surface
    const sx = K[0] - 0.5;
    const warm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(sx, 1.27, K[2]), V(sx + 0.003, 1.16, K[2]), V(sx, 1.06, K[2])]), 12, 0.009, 8), honeyM);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.012, 8, 20).rotateX(Math.PI / 2).translate(sx, 1.06, K[2]), honeyM);
    // cold: a stiff lump clinging under the dipper
    const cx = K[0] + 0.55;
    const lump = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12).scale(1, 1.25, 1).translate(cx, 1.13, K[2]), honeyM);
    for (const m of [warm, coil, lump]) { m.castShadow = true; R.add(m); this.kitchenHoney.push(m); }
  }
  private buildOffice(R: THREE.Object3D) {
    const O = OFFICE, ob = new Batch();
    ob.add(boxGeo(V(O[0] - 4, -0.1, O[2] - 1.6), V(O[0] + 4, 0, O[2] + 4)), lam("kFloor", () => ({ map: rep(planksHD(), 1, 1) })));
    ob.add(boxGeo(V(O[0] - 4, 0, O[2] - 1.6), V(O[0] + 4, 3.2, O[2] - 1.4)), lam("oWall", () => ({ map: rep(wallpaper("oWallT", "#3f6f5a", "#386350"), 8, 1) })));
    ob.add(boxGeo(V(O[0] - 0.85, 0.76, O[2] - 0.45), V(O[0] + 0.85, 0.82, O[2] + 0.45)), lam("desk", () => ({ color: "#7a4a2c" })));
    ob.add(boxGeo(V(O[0] - 0.85, 0, O[2] - 0.45), V(O[0] - 0.35, 0.76, O[2] + 0.4)), lam("desk", () => ({ color: "#7a4a2c" })));
    ob.add(boxGeo(V(O[0] + 0.35, 0, O[2] - 0.45), V(O[0] + 0.85, 0.76, O[2] + 0.4)), lam("desk", () => ({ color: "#7a4a2c" })));
    const paper = new THREE.PlaneGeometry(0.9, 0.56).rotateX(-Math.PI / 2).translate(O[0], 0.823, O[2] + 0.12);
    ob.add(paper, lam("blueprint", () => ({ map: paperTex() })));
    ob.add(new THREE.CylinderGeometry(0.035, 0.04, 0.06, 12).translate(O[0] + 0.6, 0.85, O[2] - 0.2), lam("inkwell", () => ({ color: "#2a2a3a" })));
    ob.add(boxGeo(V(O[0] - 1.6, 1.2, O[2] - 1.39), V(O[0] - 0.6, 2.0, O[2] - 1.36)), lam("framedPlan", () => ({ map: paperTex() })));
    ob.add(boxGeo(V(O[0] + 0.7, 1.3, O[2] - 1.39), V(O[0] + 1.5, 2.1, O[2] - 1.36)), lam("framedPlan", () => ({ map: paperTex() })));
    ob.build(R);
    const sb = new Batch();
    sb.add(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 10).translate(0, 0.1, 0), lam("dipper", () => ({ color: "#a8744a" })));
    sb.add(new THREE.SphereGeometry(0.035, 12, 8).translate(0, 0.17, 0), lam("dipper", () => ({ color: "#a8744a" })));
    sb.add(boxGeo(V(-0.06, 0.02, -0.04), V(0.06, 0.05, 0.04)), lam("stampBlock", () => ({ color: "#6e4a30" })));
    sb.add(boxGeo(V(-0.058, 0, -0.038), V(0.058, 0.02, 0.038)), lam("stampPad", () => ({ color: "#c8323a" })));
    sb.build(this.stamp); R.add(this.stamp);
  }

  /** camera-relative sun, frozen per shot */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(SUN_SHOT[id]?.az ?? L.az), el = THREE.MathUtils.degToRad(SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private wide(i: number) { while (this.wides.length <= i) this.wides.push(new Actor(this.root, WIDE)); return this.wides[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], tau = s.tau(t), L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 6, 110);
    if (id === 11 || id === 14) Rr = 4.5;
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.fill.intensity = 0;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;

    // ---- story props ----
    const ts = tankAt(id, t), fl = floodAt(id, t);
    this.poseTank(ts, tau, t, id);
    const shove = id >= 8 && id !== 16 ? (id === 8 ? smooth((t - 30.95) / 0.9) : 1) : 0;
    this.fire.position.x = FIREHOUSE[0] + 3.2 * shove; this.fire.rotation.z = -0.05 * shove; this.fire.rotation.y = 0.04 * shove;
    const hit = id >= 8 && id !== 16 ? (id === 8 ? smooth((t - 33.0) / 0.5) : 1) : 0;
    this.hitBent.rotation.z = 0.07 * hit;
    // el train: crosses in shot 2, parked over the hit in 8c, gone otherwise
    this.train.visible = id === 2 || id === 8 || id === 16;
    this.train.position.x = id === 2 ? -150 + 9 * (t - 7.0) : id === 8 ? EL_HIT_X - 8 : -60 + 4 * (t - 57.7);
    this.train.rotation.x = id === 8 ? 0.02 * hit * Math.sin(t * 9) : 0;
    // wagon: rolling along the street (shot 2), stuck and tipped in the molasses (shot 10)
    this.wagon.visible = id === 2 || id === 10;
    if (id === 2) { this.wagon.position.set(WAGON.x0 + WAGON.sp * (t - WAGON.t0) - 2.4, 0, WAGON.z); this.wagon.rotation.set(0, 0, 0); }
    else { this.wagon.position.set(-25.6, molDepth(-25.6, 9.4) - 0.55, 9.4); this.wagon.rotation.set(0.12, 0, -0.08); }
    this.ship.visible = id === 6 || id === 2;
    this.fireboat.visible = id === 15;
    this.plank.visible = id === 5; this.plank.position.y = paintY(tau) - 0.15;
    this.hose.visible = id === 15;
    this.summer.visible = id === 16;
    this.stamp.visible = id === 14 && f >= 1550 && f < 1609;
    this.stamp.position.set(OFFICE[0] - 0.2, 0.825 + 0.28 * (1 - stampK(t)), OFFICE[2] + 0.12);
    this.poseFlood(fl, t);
    this.poseCrates(id, fl, t);

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0, wi = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = p.geo === "wide" ? this.wide(wi++) : this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      if (a.mat.emissiveMap) a.mat.emissive.set(tint);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    for (let i = wi; i < this.wides.length; i++) this.wides[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e3 of fused) e3.bind();
    return focus;
  }

  private poseTank(ts: ReturnType<typeof tankAt>, tau: number, t: number, id: number) {
    this.tank.visible = !ts.wreck && !ts.gone;
    this.wreck.visible = ts.wreck && !ts.gone;
    const h = ts.brown * TANK_H;
    this.tankBrown.visible = h > 0.01; this.tankBrown.scale.y = Math.max(0.001, h);
    this.brownTex.repeat.set(4, 1); // plates stay their size on the brown band too (uv v spans the band)
    (this.tankRoof.material as THREE.MeshLambertMaterial).color.set(ts.brown > 0.02 ? "#6b3a22" : "#7b838d");
    const g = ts.groan * 0.004 * Math.sin(t * 23);
    this.tank.scale.set(1 + g, 1, 1 + g);
    // rivet heads: only near the close-up seam in shots 6-7; popped ones are gone
    this.rivets.visible = id === 7;
    const q = new THREE.Quaternion(), one = V(1, 1, 1);
    this.rivetPos.forEach((p, i) => {
      const popAt = RIVETS[i % RIVETS.length] + Math.floor(i / RIVETS.length) * 0.0;
      const popped = id === 7 && i % 4 === 1 && tau >= popAt;
      this.rivets.setMatrixAt(i, this.m4.compose(popped ? V(0, -50, 0) : p, q.setFromAxisAngle(V(0, 1, 0), Math.atan2(p.x - TANK[0], p.z - TANK[2])), one));
    });
    this.rivets.instanceMatrix.needsUpdate = true;
    void clamp01;
  }

  /** radial heightfield: rings dense near the front; crest at the front, steep face, settled depth behind */
  private poseFlood(fl: Flood, t: number) {
    this.flood.visible = fl.on;
    if (!fl.on) return;
    const NR = this.NR, NA = this.NA, pos = this.floodGeo.attributes.position.array as Float32Array, uv = this.floodGeo.attributes.uv.array as Float32Array;
    const s = Math.max(0.05, fl.s), Rf = frontR(s), Hc = crestH(s) * (fl.s > 100 ? 0.0 : 1), eps = 0.8 + 0.12 * Hc, Lc = 2.5 + 0.5 * Math.min(s, 10);
    const R0 = 0.5, Rend = Rf + eps;
    for (let i = 0; i < NR; i++) {
      const u = i / (NR - 1), w = 1 - (1 - u) ** 2.2, r = R0 + (Rend - R0) * w;
      for (let j = 0; j <= NA; j++) {
        const a = (j / NA) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const x = TANK[0] + r * sa, z = TANK[2] + r * ca;
        const hb = baseH(s, r) * fl.level;
        let h: number;
        if (r <= Rf) h = hb + (Math.max(Hc, hb) - hb) * Math.exp(-(((Rf - r) / Lc) ** 2));
        else h = (hb + (Math.max(Hc, hb) - hb)) * (1 - smooth((r - Rf) / eps)) + 0.03;
        // lumps and ripples (gloss breaks), quieter when cooled and thick
        h += (0.09 - 0.05 * fl.thick) * Math.sin(r * 0.9 - t * 3 * (1 - fl.thick) + j * 0.7) * Math.sin(j * 1.3 + r * 0.4);
        // the crest leans forward a little (the curl of the wave)
        const lean = r <= Rf ? 0.35 * Hc * Math.exp(-(((Rf - r) / (Lc * 0.6)) ** 2)) * clamp01(h / Math.max(0.1, Hc)) : 0;
        const rr = r + lean, X = TANK[0] + rr * sa, Z = TANK[2] + rr * ca;
        const k = (i * (NA + 1) + j);
        pos[k * 3] = X; pos[k * 3 + 1] = yGround(z) + Math.max(0.02, h); pos[k * 3 + 2] = Z;
        uv[k * 2] = j / 8; uv[k * 2 + 1] = r / 6;
        void x;
      }
    }
    this.floodGeo.attributes.position.needsUpdate = true; this.floodGeo.attributes.uv.needsUpdate = true;
    this.floodGeo.computeVertexNormals();
    this.floodMat.shininess = 38 - 26 * fl.thick;
    this.floodMat.specular.set(fl.thick > 0.5 ? "#5a3a24" : "#a8673a");
    this.floodMat.color.set(fl.thick > 0.5 ? "#5a2c12" : "#6e3614");
  }
  private poseCrates(id: number, fl: Flood, t: number) {
    const on = (id === 1 || id === 8) && fl.on && fl.s > 0.3;
    const s = Math.max(0.05, fl.s), Rf = frontR(s), Hc = crestH(s);
    this.crates.forEach((m, i) => {
      m.visible = on;
      if (!on) return;
      const a = -Math.PI / 2 + (i - 3) * 0.05 + (i % 2 ? 0.25 : -0.2) * (i / 7); // toward -x (down the street)
      const r = Rf - 1.2 - (i % 3) * 1.1;
      m.position.set(TANK[0] + r * Math.sin(a), Hc * (0.75 + 0.08 * (i % 3)) + 0.2 * Math.sin(t * 3 + i), TANK[2] + r * Math.cos(a));
      m.rotation.set(t * (0.8 + i * 0.2), t * 0.5 + i, t * (0.6 + i * 0.1));
    });
  }
}

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.2 * wTime, 0.0);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;
void kitClone;
