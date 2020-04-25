import React from "react";
import GN from "std/genes/GN";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/gene";

export const GenePushWater = Gene.make(
  {
    name: "Push Water",
    levelCosts: [1, 1, 1, 1, 1],
    levelProps: {
      secondsPerPush: [20, 12, 7, 3, 1],
    },
    description: ({ secondsPerPush }) => (
      <>
        Every <GN value={secondsPerPush} sigFigs={2} /> seconds, push 1 water from this Cell to each neighboring Cell.
      </>
    ),
  },
  {
    cooldown: 0,
  },
  (dt, { cell, state, props: { secondsPerPush } }) => {
    const neighbors = cell.world.tileNeighbors(cell.pos);
    if (state.cooldown <= 0) {
      for (const [, tile] of neighbors) {
        // push water to nearby sources
        if (tile instanceof Cell) {
          // tile.inventory.give(cell.inventory, randRound(LEAF_WATER_INTAKE_PER_SECOND * dt), 0);
          cell.inventory.give(tile.inventory, 1, 0);
          // if (water > 0) {
          //   break;
          // }
        }
      }
      state.cooldown += secondsPerPush;
    }
    state.cooldown -= dt;
  }
);
export type GenePushWater = typeof GenePushWater;
