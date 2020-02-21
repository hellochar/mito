import React from "react";
import GN from "std/genes/GN";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/gene";

export const GeneAttractsSugar = Gene.make(
  {
    name: "Attracts Sugar",
    levelCosts: [1, 2, 3, 4, 5],
    levelProps: {
      secondsPerPull: [20, 10, 5, 3, 2],
    },
    description: ({ secondsPerPull }) => (
      <>
        Every <GN value={secondsPerPull} sigFigs={2} /> seconds, take 1 sugar from any neighboring Cell.
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
        // pull water from nearby sources
        if (tile instanceof Cell) {
          const { water } = tile.inventory.give(cell.inventory, 0, 1);
          if (water > 0) {
            break;
          }
        }
      }
      state.cooldown += secondsPerPull;
    }
    state.cooldown -= dt;
  }
);
export type GeneAttractsSugar = typeof GeneAttractsSugar;
