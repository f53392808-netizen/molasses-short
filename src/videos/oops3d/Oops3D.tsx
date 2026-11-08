// Oopsonomics ep01 3D test: one three.js town (world3d.ts), camera + cast timeline (story3d.ts), bridge post chain
// (ink -> lens -> bloom -> neutral tone map -> day grade), Montserrat Black key numbers on top.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "../molasses/ink";
import { LensBlur } from "../molasses/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../molasses/grade";
import { World3D } from "./world3d";
import { TOTAL, TEXTS, FLASH_AT, shotAt, clamp01, camAt, cast, TextItem } from "./story3d";

export const OOPS3D_FRAMES = TOTAL;
/** QA only: inputProps { remap: [f0, f1, ...] } renders those story frames as frames 0..n-1 (one page load) */
const useF = () => { const f = useCurrentFrame(); const r = (getInputProps() as { remap?: number[] }).remap; return r ? r[Math.min(f, r.length - 1)] : f; };
const MSAA = Number((getInputProps() as { post?: { msaa?: number } }).post?.msaa ?? 2);
const DOF: Record<string, number> = { hook: 6, crowd: 4, fancy: 9, deliver: 0, billion: 5, porch: 7, dinner: 8, coin: 10, rewind: 0, y2010: 7, game: 8, forum: 6 };
const dofOf = (s: ReturnType<typeof shotAt>) => s.dof ?? DOF[s.id] ?? (s.cam ? ((s.cam.minD ?? 0) >= 9 ? 0 : 6) : 5);

const Inner: React.FC = () => {
  const f = useF();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World3D(), []);
  const fx = useMemo(() => {
    const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
    return { ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 4.2, widthFar: 2.6 }), lens: new LensBlur({ maxCoC: 20, nearScale: 1.0 }), bloom: b,
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day) };
  }, [camera, scene]);
  useEffect(() => () => { try { (fx.ink as any)?.dispose?.(); } catch (e) {} }, [fx]);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(f, cam, scene);
  noInkFallback(world.root);
  const s = shotAt(f / 30);
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  fx.lens.focus = Math.max(0.3, target.clone().sub(cam.position).dot(fwd));
  fx.lens.cInf = dofOf(s);
  const post = useMemo(() => (
    <EffectComposer multisampling={MSAA}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </EffectComposer>
  ), [fx]);
  return (<><primitive object={world.root} dispose={null} />{post}</>);
};

const useFont = () => {
  const [h] = useState(() => delayRender("mont"));
  useEffect(() => { const ff = new FontFace("Mont", `url(${staticFile("oops/Montserrat-Black.ttf")})`, { weight: "900" }); ff.load().then((x) => { (document as any).fonts.add(x); continueRender(h); }).catch(() => continueRender(h)); }, [h]);
};

// ---- text placement: pick the screen spot (top / bottom / sides) that covers no head over the whole time the text is up, and no other text ----
type Spot = { x0: number; y0: number; w: number; h: number; size: number; align: "c" | "l" | "r" };
const spots = new Map<number, Spot>();
const pcam = new THREE.PerspectiveCamera(44, 16 / 9, 0.1, 2000);
const headRects = (t: number) => {
  const C = camAt(t); pcam.fov = C.fov; pcam.position.set(...C.pos); pcam.up.set(0, 1, 0); pcam.lookAt(...C.look); pcam.rotateZ(C.roll); pcam.updateProjectionMatrix(); pcam.updateMatrixWorld();
  const out: [number, number, number, number][] = [];
  for (const w of cast(t)) {
    if (w.lie) continue; const k = w.k ?? 1, hy = (w.st.mode === "sit" ? 1.28 : 1.68) * k;
    const c = new THREE.Vector3(w.pos[0], w.pos[1] + hy, w.pos[2]).project(pcam); if (c.z > 1 || c.z < -1) continue;
    const e = new THREE.Vector3(w.pos[0], w.pos[1] + hy + 0.62 * k, w.pos[2]).project(pcam);
    const cx = (c.x + 1) * 960, cy = (1 - c.y) * 540, r = Math.max(30, Math.abs((1 - e.y) * 540 - cy));
    out.push([cx - r * 1.05, cy - r, cx + r * 1.05, cy + r * 1.15]);
  }
  return out;
};
const ov = (a: number[], b: number[]) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
export const spotOf = (i: number): Spot => {
  const got = spots.get(i); if (got) return got;
  const it = TEXTS[i]; let size = it.size; const est = (sz: number) => it.s.length * sz * 0.72 + sz * 0.4;
  while (est(size) > 1720) size *= 0.94;
  const w = est(size), h = size * 1.2 + (it.lt ? 24 : 0);
  const C: [Spot["align"], number][] = it.lt ? [["l", 1080 - h - 64], ["r", 1080 - h - 64], ["l", 56], ["r", 56]]
    : [["c", 56], ["c", 1080 - h - 64], ["l", 56], ["r", 56], ["l", 1080 - h - 64], ["r", 1080 - h - 64], ["l", (1080 - h) / 2], ["r", (1080 - h) / 2]];
  const heads: number[][] = []; for (let k = 0; k <= 8; k++) heads.push(...headRects(it.a + (it.b - it.a) * (k / 8) * 0.999));
  let best: Spot | null = null, bs = 1e18;
  C.forEach(([al, y0], ci) => {
    const x0 = al === "c" ? (1920 - w) / 2 : al === "l" ? 72 : 1920 - 72 - w, r = [x0 - 12, y0 - 8, x0 + w + 12, y0 + h + 8];
    let sc = ci * 10;
    for (const hr of heads) sc += ov(r, hr) * 10;
    TEXTS.forEach((o, j) => { if (j !== i && spots.has(j) && o.a < it.b && o.b > it.a) { const q = spots.get(j)!; sc += ov(r, [q.x0 - 30, q.y0 - 20, q.x0 + q.w + 30, q.y0 + q.h + 20]) * 1000; } });
    if (sc < bs) { bs = sc; best = { x0, y0, w, h, size, align: al }; }
  });
  spots.set(i, best!); return best!;
};

const Big: React.FC<{ t: number; i: number; it: TextItem }> = ({ t, i, it }) => {
  const { a, b, s, col, slam, lt } = it;
  if (t < a || t >= b) return null;
  for (let j = 0; j < i; j++) spotOf(j);
  const sp = spotOf(i), size = sp.size;
  const u = clamp01((t - a) / 0.2), out = clamp01((b - t) / 0.15);
  const sc = slam ? 1 + 0.5 * Math.pow(1 - u, 3) - 0.08 * Math.sin(clamp01((t - a - 0.2) / 0.25) * Math.PI) : 1;
  const rot = slam ? -3 + 4 * Math.pow(1 - u, 2) : 0;
  const origin = sp.align === "c" ? "center" : sp.align === "l" ? "left" : "right";
  return (
    <div style={{ position: "absolute", left: sp.x0, top: sp.y0, width: sp.w, height: sp.h, display: "flex", alignItems: "center", justifyContent: sp.align === "c" ? "center" : sp.align === "l" ? "flex-start" : "flex-end", opacity: Math.min(slam ? 1 : u, out) }}>
      {lt ? (
        <div style={{ fontFamily: "Mont", fontWeight: 900, fontSize: size, color: col, background: "rgba(36,23,38,0.82)", padding: "10px 26px", borderLeft: "12px solid #FFD21F", borderRadius: 6, whiteSpace: "nowrap", letterSpacing: 1, transform: `translateY(${(1 - easeO(u)) * 30}px)` }}>{s}</div>
      ) : (
        <div style={{ fontFamily: "Mont", fontWeight: 900, fontSize: size, color: col, transform: `scale(${sc}) rotate(${rot}deg)`, transformOrigin: origin, letterSpacing: 2, whiteSpace: "nowrap",
          WebkitTextStroke: `${Math.round(size * 0.11)}px #241726`, paintOrder: "stroke fill", textShadow: `0 ${size * 0.06}px 0 #241726`, lineHeight: 1 }}>{s}</div>
      )}
    </div>
  );
};
const easeO = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

export const OopsEp01_3D: React.FC = () => {
  useFont();
  const f = useF(), t = f / 30;
  let flash = 0; for (const a of FLASH_AT) { const d = t - a; if (d >= 0 && d < 0.2) flash = 0.85 * (1 - d / 0.2); }
  return (
    <AbsoluteFill style={{ background: "#bcd8f2" }}>
      <ThreeCanvas width={1920} height={1080} shadows={{ type: THREE.PCFSoftShadowMap } as any} gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 44, near: 0.2, far: 1500 }}>
        <Inner />
      </ThreeCanvas>
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {TEXTS.map((x, i) => <Big key={i} t={t} i={i} it={x} />)}
    </AbsoluteFill>
  );
};
