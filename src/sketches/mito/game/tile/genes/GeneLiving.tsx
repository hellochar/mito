import React from "react";
import GN from "sketches/mito/ui/GN";
import { Gene } from "../chromosome";
export const GeneLiving = Gene.make(
  {
    name: "Living",
    levelCosts: [-5, -2, 0, 2, 4],
    levelProps: {
      secondsPerUpkeep: [120, 240, 480, 600, 720],
    },
    description: ({ secondsPerUpkeep }) => (
      <>
        Uses 100% of its energy every <GN value={secondsPerUpkeep} /> seconds.
      </>
    ),
  },
  {},
  (dt, { cell, props: { secondsPerUpkeep } }) => {
    cell.energy -= (1 / secondsPerUpkeep) * dt;
  }
);
export type GeneLiving = typeof GeneLiving;
