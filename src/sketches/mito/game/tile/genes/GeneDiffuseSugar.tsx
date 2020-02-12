import React from "react";
import GN from "sketches/mito/ui/GN";
import { Gene } from "../../../../../core/cell/chromosome";

export const GeneDiffuseSugar = Gene.make(
  {
    name: "Diffuse Sugar",
    levelCosts: [0, 1, 2, 3, 5],
    static: {
      diffusionSugar: [0.01, 0.02, 0.04, 0.08, 0.16],
    },
    levelProps: {},
    description: (props, { diffusionSugar }) => (
      <>
        <p>Give sugar to neighboring Cells with less.</p>
        <p>
          On average, give 1 sugar every <GN value={1 / diffusionSugar!} sigFigs={3} /> seconds.
        </p>
      </>
    ),
  },
  {},
  () => {}
);
export type GeneDiffuseSugar = typeof GeneDiffuseSugar;
