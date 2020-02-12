import React from "react";
import GN from "sketches/mito/ui/GN";
import { Gene } from "../../../../../core/cell/chromosome";

export const GeneDiffuseWater = Gene.make(
  {
    name: "Diffuse Water",
    levelCosts: [0, 1, 2, 3, 5],
    static: {
      diffusionWater: [0.01, 0.02, 0.04, 0.08, 0.16],
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
