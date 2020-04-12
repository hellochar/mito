import { randFloat } from "math";
import React from "react";
import GN from "std/genes/GN";
import { takeFromOneNeighborCell } from "std/geneUtil";
import { Gene } from "../../core/cell/gene";
import RI from "./RI";

export const GeneAttractsWater = Gene.make(
  {
    name: "Attracts Water",
    levelCosts: [1, 2, 3, 4, 5],
    levelProps: {
      secondsPerPull: [20, 10, 5, 3, 2],
    },
    description: ({ secondsPerPull }) => (
      <>
        Every <GN value={secondsPerPull} sigFigs={2} /> seconds, take 1<RI w /> from any neighboring Cell.
      </>
    ),
  },
  (gene, props) => ({
    cooldown: randFloat(0, props.secondsPerPull),
  }),
  (dt, { cell, state, props: { secondsPerPull } }) => {
    if (state.cooldown <= 0) {
      takeFromOneNeighborCell(cell, 1, 0);
      state.cooldown += secondsPerPull;
    }
    state.cooldown -= dt;
  }
);
export type GeneAttractsWater = typeof GeneAttractsWater;
