import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, Outfit, INK } from "../molasses/toon";

// "Buck" — host of the money-disasters channel: green banker's cap, mustard coat, red tie, signature curl.
export const BUCK: Outfit = { jacket: "#d9a33a", pants: "#4a3b33", boots: "#2a1e1a", hat: "cap", cap: "#2f8a57", buttons: "#f4e3a1", skin: "#f5c9a0", build: "stout" };

export const MascotSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current!; const g = c.getContext("2d")!;
    g.fillStyle = "#f6ecd6"; g.fillRect(0, 0, 1800, 1000);
    const poses: [string, any][] = [["grin", { mode: "stand", expr: "grin", wave: 0.6, seed: 7 }], ["shock", { mode: "stand", expr: "shock", seed: 7 }], ["nervous", { mode: "stand", expr: "nervous", seed: 7, look: 0.4 }]];
    poses.forEach(([_, o], i) => {
      g.save(); g.translate(i * 600, 0);
      g.fillStyle = "rgba(36,23,38,0.12)"; g.beginPath(); g.ellipse(300, 975, 170, 22, 0, 0, Math.PI * 2); g.fill();
      bodyFront(new Pen(g), BUCK, o); g.restore();
    });
    g.fillStyle = INK; g.font = "bold 64px sans-serif"; g.fillText("BUCK", 40, 90);
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1800} height={1000} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
