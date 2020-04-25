import React from "react";
import GN from "std/genes/GN";
import { takeFromEveryNeighborCell } from "std/geneUtil";
import { Gene } from "../../core/cell/gene";
import RI from "./RI";

export const GeneAttractsSugar = Gene.make(
  {
    name: "Attracts Sugar",
    levelCosts: [1, 1, 1, 1, 4],
    levelProps: {
      secondsPerPull: [20, 14, 9, 5, 1],
    },
    static: {
      energyUpkeep: 1 / 1200,
    },
    description: ({ secondsPerPull }) => (
      <>
        Every <GN value={secondsPerPull} sigFigs={2} /> seconds, take 1<RI s /> from every neighboring Cell.
      </>
    ),
  },
  {
    cooldown: 0,
  },
  (dt, { cell, state, props: { secondsPerPull } }) => {
    if (state.cooldown <= 0) {
      takeFromEveryNeighborCell(cell, 0, 1);
      state.cooldown += secondsPerPull;
    }
    state.cooldown -= dt;
  }
);
export type GeneAttractsSugar = typeof GeneAttractsSugar;
