import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { setInk } from "../molasses/toon";
import { BUCK, LASZLO, JEREMY, DRIVER, extra, drawChar, CharState } from "./cast";
export const OopsSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null); const f = useCurrentFrame();
  useLayoutEffect(() => {
    setInk("#351f22");
    const g = ref.current!.getContext("2d")!; g.fillStyle = "#f6ecd6"; g.fillRect(0, 0, 1920, 1080);
    const row: [any, CharState][] = [
      [BUCK, { expr: "neutral", L: "down", R: "point", talk: 0.6 }], [BUCK, { expr: "worried", L: "hip", R: "shrug" }], [BUCK, { expr: "o", L: "coin", R: "down", prop: "coin" }],
      [LASZLO, { expr: "smile", L: "type", R: "type" }], [LASZLO, { expr: "content", L: "hold", R: "hold", prop: "box" }], [JEREMY, { expr: "flat", L: "hold", R: "hold", prop: "laptop" }],
      [JEREMY, { expr: "wide", L: "down", R: "cardOut", prop: "card" }], [DRIVER, { expr: "smile", L: "hold", R: "hold", prop: "boxes", propN: 2 }], [extra(1), { expr: "neutral" }], [extra(2), { expr: "smile", R: "wave" }],
    ];
    row.forEach(([c, s], i) => drawChar(g, c, 100 + (i % 5) * 430, 520 + Math.floor(i / 5) * 540, 0.5, s, f / 30 + i));
  }, [f]);
  return <AbsoluteFill><canvas ref={ref} width={1920} height={1080} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
