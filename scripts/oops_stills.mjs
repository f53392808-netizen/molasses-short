// usage: node scripts/oops_stills.mjs <bundleDir> <outDir> <scale> <mg:0|1> t1 t2 ...  (times in seconds)
import { renderStill, selectComposition } from "@remotion/renderer";
const [bundle, out, scale, mg, ...ts] = process.argv.slice(2);
const inputProps = { mg: mg === "1" };
const comp = await selectComposition({ serveUrl: bundle, id: "OopsEp01", inputProps, chromiumOptions: { gl: "swangle" } });
for (const t of ts) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(parseFloat(t) * 30));
  await renderStill({ composition: comp, serveUrl: bundle, output: `${out}/f${String(frame).padStart(5, "0")}.png`, frame, scale: parseFloat(scale), inputProps, chromiumOptions: { gl: "swangle" }, timeoutInMilliseconds: 60000 });
}
console.log("done", ts.length);
