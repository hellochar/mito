import React from "react";
import GN from "std/genes/GN";
import { takeFromOneNeighborCell } from "std/geneUtil";
import { Gene } from "../../core/cell/gene";
import RI from "./RI";

export const GeneAttractsSugar = Gene.make(
  {
    name: "Attracts Sugar",
    levelCosts: [1, 2, 3, 4, 5],
    levelProps: {
      secondsPerPull: [20, 10, 5, 3, 2],
    },
    description: ({ secondsPerPull }) => (
      <>
        Every <GN value={secondsPerPull} sigFigs={2} /> seconds, take 1<RI s /> from any neighboring Cell.
      </>
    ),
  },
  {
    cooldown: 0,
  },
  (dt, { cell, state, props: { secondsPerPull } }) => {
    if (state.cooldown <= 0) {
      takeFromOneNeighborCell(cell, 0, 1);
      state.cooldown += secondsPerPull;
    }
    state.cooldown -= dt;
  }
);
export type GeneAttractsSugar = typeof GeneAttractsSugar;
