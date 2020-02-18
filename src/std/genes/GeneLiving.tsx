import React from "react";
import GN from "std/genes/GN";
import { Gene } from "../../core/cell/chromosome";
export const GeneLiving = Gene.make(
  {
    name: "Living",
    levelCosts: [-6, -8, -10, -12, -15],
    levelProps: {
      secondsPerUpkeep: [720, 600, 480, 240, 120],
    },
    description: ({ secondsPerUpkeep }) => (
      <>
        Burns 100% energy every <GN value={secondsPerUpkeep} /> seconds.
      </>
    ),
  },
  {},
  (dt, { cell, props: { secondsPerUpkeep } }) => {
    cell.energy -= (1 / secondsPerUpkeep) * dt;
  }
);
export type GeneLiving = typeof GeneLiving;
