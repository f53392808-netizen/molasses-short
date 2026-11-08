// usage: node scripts/oops3d_frames.mjs <outDir> <scale> <start> <end> <everyNth>  -> one page load, many frames
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import fs from "fs";
const [out, scale, a, b, n, remapS] = process.argv.slice(2);
const remap = remapS ? remapS.split(",").map(Number) : null;
fs.mkdirSync(out, { recursive: true });
const serveUrl = fs.existsSync("/tmp/b3d/index.html") ? "/tmp/b3d" : await bundle({ entryPoint: "src/index.ts", outDir: "/tmp/b3d" });
const opt = { chromiumOptions: { gl: "swangle" } };
const comp = await selectComposition({ serveUrl, id: "OopsEp01-3D", inputProps: remap ? { remap } : {}, ...opt });
await renderFrames({ composition: comp, serveUrl, outputDir: out, inputProps: remap ? { remap } : {}, imageFormat: "jpeg", jpegQuality: 85, scale: +scale, frameRange: [+a, +b], everyNthFrame: +n, concurrency: 1, ...opt, timeoutInMilliseconds: 120000,
  onStart: () => {}, onFrameUpdate: (i) => console.log("frame", i) });
console.log("done");
