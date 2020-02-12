import React from "react";
import GN from "sketches/mito/ui/GN";
import { Cell } from "../../../../../core/cell/cell";
import { Gene } from "../../../../../core/cell/chromosome";

export const GenePushWater = Gene.make(
  {
    name: "Push Water",
    levelCosts: [1, 2, 3, 4, 5],
    levelProps: {
      secondsPerPull: [20, 10, 5, 3, 2],
    },
    description: ({ secondsPerPull }) => (
      <>
        Every <GN value={secondsPerPull} sigFigs={2} /> seconds, push 1 water from this Cell to each neighboring Cell.
      </>
    ),
  },
  {
    cooldown: 0,
  },
  (dt, { cell, state, props: { secondsPerPull } }) => {
    const neighbors = cell.world.tileNeighbors(cell.pos);
    if (state.cooldown <= 0) {
      for (const [, tile] of neighbors) {
        // push water to nearby sources
        if (tile instanceof Cell) {
          // tile.inventory.give(cell.inventory, randRound(LEAF_WATER_INTAKE_PER_SECOND * dt), 0);
          const { water } = cell.inventory.give(tile.inventory, 1, 0);
          // if (water > 0) {
          //   break;
          // }
        }
      }
      state.cooldown += secondsPerPull;
    }
    state.cooldown -= dt;
  }
);
export type GenePushWater = typeof GenePushWater;
