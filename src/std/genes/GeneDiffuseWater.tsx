import React from "react";
import GN from "std/genes/GN";
import { Gene } from "../../core/cell/gene";

export const GeneDiffuseWater = Gene.make(
  {
    name: "Diffuse Water",
    levelCosts: [0],
    static: {
      diffusionWater: [0.08],
    },
    levelProps: {},
    description: (props, { diffusionWater }) => (
      <>
        <p>Give water to neighboring Cells with less.</p>
        <p>
          On average, give 1 water every <GN value={1 / diffusionWater!} sigFigs={3} /> seconds.
        </p>
      </>
    ),
  },
  {},
  () => {}
);
export type GeneDiffuseWater = typeof GeneDiffuseWater;
