import React from "react";
import { takeFromOneNeighborCell } from "std/geneUtil";
import { Gene } from "../../core/cell/gene";
import RI from "./RI";

export const GeneOsmosis = Gene.make(
  {
    name: "Osmosis",
    levelCosts: [1],
    levelProps: {
      secondsPerPull: 1,
    },
    static: {},
    description: ({ secondsPerPull }) => (
      <>
        While this cell has more <RI s /> than <RI w />, take 1<RI w /> every {secondsPerPull} seconds from a neighbor.
      </>
    ),
  },
  {
    cooldown: 0,
    isOsmosising: false,
  },
  (dt, { cell, state, props: { secondsPerPull } }) => {
    state.isOsmosising = cell.inventory.sugar > cell.inventory.water;
    if (state.cooldown <= 0) {
      if (state.isOsmosising) {
        takeFromOneNeighborCell(cell, 1, 0);
      }
      state.cooldown += secondsPerPull;
    }
    state.cooldown -= dt;
  }
);
export type GeneOsmosis = typeof GeneOsmosis;
