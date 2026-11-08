// Oopsonomics ep01 "He Paid $1 Billion For 2 Pizzas": 2D canvas toon world + HyperFrames motion-graphics overlays.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, delayRender, continueRender } from "remotion";
import { setInk } from "../molasses/toon";
import { drawSetBg, drawSetFg, drawLight } from "./sets";
import { SHOTS, camAt, Shot, Ctx } from "./shots";
import { ease, clamp } from "./cast";
import ENV from "./env.json";
import MG from "./mg.json";

export const OOPS_FPS = 30;
export const OOPS_FRAMES = 19608; // 653.583667 s voice-over
const W = 1920, H = 1080, TR = 0.25; // half-length of a pan/fade transition (s)

const fontHandle = typeof window !== "undefined" ? delayRender("Montserrat") : 0;
if (typeof window !== "undefined") {
  const f = new FontFace("Mont", `url(${staticFile("oops/Montserrat-Black.ttf")})`, { weight: "900" });
  f.load().then((ff) => { (document as any).fonts.add(ff); continueRender(fontHandle); }).catch(() => continueRender(fontHandle));
}

const shotEnd = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : OOPS_FRAMES / OOPS_FPS);
/** camera of shot i at absolute time t (extrapolates linearly past its ends so it never stops) + a tiny global drift */
export const camOf = (i: number, t: number) => {
  const s = SHOTS[i], c = camAt(s, t - s.t0, shotEnd(i) - s.t0);
  return { x: c.x + 3 * Math.sin(t * 0.7), y: c.y + 2 * Math.sin(t * 0.53 + 1), z: c.z * (1 + 0.004 * Math.sin(t * 0.41)) };
};
const renderShot = (g: CanvasRenderingContext2D, i: number, t: number, talk: number) => {
  const s = SHOTS[i], c = camOf(i, t);
  g.save();
  g.translate(W / 2, H / 2); g.scale(c.z, c.z); g.translate(-c.x, -c.y);
  drawSetBg(g, s.set);
  const C: Ctx = { g, t, lt: t - s.t0, dur: shotEnd(i) - s.t0, talk, shot: s };
  s.d?.(C);
  drawSetFg(g, s.set);
  s.o?.(C);
  g.restore();
  drawLight(g, s.set);
};
let grainC: HTMLCanvasElement | null = null;
const grain = () => { if (!grainC) { grainC = document.createElement("canvas"); grainC.width = grainC.height = 256; const q = grainC.getContext("2d")!, im = q.createImageData(256, 256); let s = 12345; for (let i = 0; i < im.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = (s >> 16) & 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } q.putImageData(im, 0, 0); } return grainC; };
let bufA: HTMLCanvasElement | null = null, bufB: HTMLCanvasElement | null = null;
const buf = (b: HTMLCanvasElement | null) => { if (!b) { b = document.createElement("canvas"); b.width = W; b.height = H; } return b; };

export const drawFrame = (g: CanvasRenderingContext2D, frame: number) => {
  setInk("#351f22");
  const t = frame / OOPS_FPS, raw = (ENV as number[])[frame] ?? 0, talk = clamp((raw - 0.12) * 1.3, 0, 0.7);
  let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].t0 <= t) i++;
  // transition into the next shot (window starts TR before its t0) or from the previous one (ends TR after)
  let a = -1, b = -1, k = 0;
  if (i + 1 < SHOTS.length && SHOTS[i + 1].tr && SHOTS[i + 1].tr !== "cut" && t > SHOTS[i + 1].t0 - TR) { a = i; b = i + 1; k = (t - (SHOTS[i + 1].t0 - TR)) / (2 * TR); }
  else if (i > 0 && SHOTS[i].tr && SHOTS[i].tr !== "cut" && t < SHOTS[i].t0 + TR) { a = i - 1; b = i; k = (t - (SHOTS[i].t0 - TR)) / (2 * TR); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (a < 0) { renderShot(g, i, t, talk); }
  else {
    const sb: Shot = SHOTS[b], e = ease(k);
    bufA = buf(bufA); bufB = buf(bufB);
    const ga = bufA.getContext("2d")!, gb = bufB.getContext("2d")!;
    ga.setTransform(1, 0, 0, 1, 0, 0); gb.setTransform(1, 0, 0, 1, 0, 0);
    renderShot(ga, a, t, talk); renderShot(gb, b, t, talk);
    if (sb.tr === "fade") { g.drawImage(bufA, 0, 0); g.globalAlpha = e; g.drawImage(bufB, 0, 0); g.globalAlpha = 1; }
    else { // whip-pan through the world: both frames slide, blurred along the move at peak speed
      const dir = sb.dir ?? 1, blur = Math.sin(Math.PI * clamp(k)) * 14;
      g.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : "none";
      g.drawImage(bufA, -dir * W * e, 0); g.drawImage(bufB, dir * W * (1 - e), 0);
      g.filter = "none";
    }
  }
  // one shared grade across every set (warm lift) + light seeded film grain to dither gradients (no banding)
  g.fillStyle = "rgba(255,214,160,0.05)"; g.fillRect(0, 0, W, H);
  const gr = grain(); g.save(); g.globalAlpha = 0.05; g.globalCompositeOperation = "overlay";
  const ox = (frame * 97) % 256, oy = (frame * 61) % 256; g.translate(-ox, -oy);
  g.fillStyle = g.createPattern(gr, "repeat")!; g.fillRect(0, 0, W + 256, H + 256); g.restore();
};

export const OopsEp01: React.FC<{ mg?: boolean }> = ({ mg = true }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { drawFrame(ref.current!.getContext("2d")!, frame); }, [frame]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#2a1a26" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      {mg && (MG as { id: string; from: number; dur: number }[]).map((m) => (
        <Sequence key={m.id} from={Math.round(m.from * OOPS_FPS)} durationInFrames={Math.round(m.dur * OOPS_FPS)}>
          <OffthreadVideo src={staticFile(`mg/${m.id}.webm`)} transparent muted />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
