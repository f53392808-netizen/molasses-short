import React from "react";
import { Composition } from "remotion";
import { MascotSheet } from "./videos/mascot/Mascot";
import { PizzaThumb } from "./videos/mascot/Thumb";
import { OopsQA } from "./videos/oops/QA";
import { OopsSheet } from "./videos/oops/Sheet";
import { OopsEp01, OOPS_FRAMES } from "./videos/oops/Oops";
import { OopsEp01_3D, OOPS3D_FRAMES } from "./videos/oops3d/Oops3D";
import { MolassesShort, MOLASSES_FRAMES } from "./videos/molasses/Molasses";

export const RemotionRoot: React.FC = () => (
  <>
  <Composition id="MolassesShort" component={MolassesShort} durationInFrames={MOLASSES_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="Mascot" component={MascotSheet} durationInFrames={1} fps={30} width={1800} height={1000} />
  <Composition id="PizzaThumb" component={PizzaThumb} durationInFrames={1} fps={30} width={1280} height={720} />
  <Composition id="OopsEp01" component={OopsEp01} durationInFrames={OOPS_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ mg: true }} />
  <Composition id="OopsEp01-3D" component={OopsEp01_3D} durationInFrames={OOPS3D_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="OopsQA" component={OopsQA} durationInFrames={40} fps={30} width={1920} height={1080} />
  <Composition id="OopsSheet" component={OopsSheet} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
