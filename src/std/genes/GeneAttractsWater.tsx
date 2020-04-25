import { randFloat } from "math";
import React from "react";
import GN from "std/genes/GN";
import { takeFromEveryNeighborCell } from "std/geneUtil";
import { Gene } from "../../core/cell/gene";
import RI from "./RI";

export const GeneAttractsWater = Gene.make(
  {
    name: "Attracts Water",
    levelCosts: [1, 1, 1, 1, 4],
    levelProps: {
      secondsPerPull: [20, 14, 9, 5, 1],
    },
    static: {
      energyUpkeep: 1 / 1000,
    },
    description: ({ secondsPerPull }) => (
      <>
        Every <GN value={secondsPerPull} sigFigs={2} /> seconds, take 1<RI w /> from every neighboring Cell.
      </>
    ),
  },
  (gene, props) => ({
    cooldown: randFloat(0, props.secondsPerPull),
  }),
  (dt, { cell, state, props: { secondsPerPull } }) => {
    if (state.cooldown <= 0) {
      takeFromEveryNeighborCell(cell, 1, 0);
      state.cooldown += secondsPerPull;
    }
    state.cooldown -= dt;
  }
);
export type GeneAttractsWater = typeof GeneAttractsWater;
