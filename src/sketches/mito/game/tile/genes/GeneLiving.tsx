import React from "react";
import GN from "sketches/mito/ui/GN";
import { Gene } from "../../../../../core/cell/chromosome";
export const GeneLiving = Gene.make(
  {
    name: "Living",
    levelCosts: [-6, -8, -10, -12, -15],
    levelProps: {
      secondsPerUpkeep: [720, 600, 480, 240, 120],
    },
    description: ({ secondsPerUpkeep }) => (
      <>
        Needs 1 sugar every <GN value={secondsPerUpkeep} /> seconds.
      </>
    ),
  },
  {},
  (dt, { cell, props: { secondsPerUpkeep } }) => {
    cell.energy -= (1 / secondsPerUpkeep) * dt;
  }
);
export type GeneLiving = typeof GeneLiving;
