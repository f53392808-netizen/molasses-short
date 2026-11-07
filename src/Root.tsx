import React from "react";
import { Composition } from "remotion";
import { MolassesShort, MOLASSES_FRAMES } from "./videos/molasses/Molasses";

export const RemotionRoot: React.FC = () => (
  <Composition id="MolassesShort" component={MolassesShort} durationInFrames={MOLASSES_FRAMES} fps={30} width={1080} height={1920} />
);
