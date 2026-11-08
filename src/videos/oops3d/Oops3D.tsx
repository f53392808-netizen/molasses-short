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
import { TOTAL, TEXTS, FLASH_AT, shotAt, clamp01 } from "./story3d";

export const OOPS3D_FRAMES = TOTAL;
/** QA only: inputProps { remap: [f0, f1, ...] } renders those story frames as frames 0..n-1 (one page load) */
const useF = () => { const f = useCurrentFrame(); const r = (getInputProps() as { remap?: number[] }).remap; return r ? r[Math.min(f, r.length - 1)] : f; };
const MSAA = Number((getInputProps() as { post?: { msaa?: number } }).post?.msaa ?? 2);
const DOF: Record<string, number> = { hook: 6, crowd: 4, fancy: 9, deliver: 0, billion: 5, porch: 7, dinner: 8, coin: 10, rewind: 0, y2010: 7, game: 8, forum: 6 };

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
  fx.lens.cInf = DOF[s.id] ?? 0;
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

const Big: React.FC<{ t: number; a: number; b: number; s: string; y: number; size: number; col: string; slam?: boolean }> = ({ t, a, b, s, y, size, col, slam }) => {
  if (t < a || t >= b) return null;
  const u = clamp01((t - a) / 0.2), out = clamp01((b - t) / 0.15);
  const sc = slam ? 1 + 0.5 * Math.pow(1 - u, 3) - 0.08 * Math.sin(clamp01((t - a - 0.2) / 0.25) * Math.PI) : 1;
  const rot = slam ? -3 + 4 * Math.pow(1 - u, 2) : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: y, opacity: Math.min(slam ? 1 : u, out) }}>
      <div style={{ fontFamily: "Mont", fontWeight: 900, fontSize: size, color: col, transform: `scale(${sc}) rotate(${rot}deg)`, letterSpacing: 2,
        WebkitTextStroke: `${Math.round(size * 0.11)}px #241726`, paintOrder: "stroke fill", textShadow: `0 ${size * 0.06}px 0 #241726`, lineHeight: 1 }}>{s}</div>
    </AbsoluteFill>
  );
};

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
      {TEXTS.map((x, i) => <Big key={i} t={t} {...x} />)}
    </AbsoluteFill>
  );
};
