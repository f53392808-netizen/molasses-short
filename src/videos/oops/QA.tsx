import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, getInputProps } from "remotion";
import { drawFrame } from "./Oops";
// QA contact sheet: frame f of this comp draws 16 story frames (4x4) from inputProps.frames
export const OopsQA: React.FC = () => {
  const f = useCurrentFrame(); const ref = useRef<HTMLCanvasElement>(null);
  const list = ((getInputProps() as any).frames ?? [0]) as number[];
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!; g.fillStyle = "#000"; g.fillRect(0, 0, 1920, 1080);
    const off = document.createElement("canvas"); off.width = 1920; off.height = 1080; const o = off.getContext("2d")!;
    for (let k = 0; k < 16; k++) { const fr = list[f * 16 + k]; if (fr === undefined) break;
      drawFrame(o, fr); const x = (k % 4) * 480, y = Math.floor(k / 4) * 270; g.drawImage(off, x, y, 478, 268);
      g.font = "bold 22px sans-serif"; g.fillStyle = "#ff0"; g.fillText(`${fr} (${(fr / 30).toFixed(1)}s)`, x + 6, y + 24); }
  }, [f]);
  return <AbsoluteFill><canvas ref={ref} width={1920} height={1080} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
