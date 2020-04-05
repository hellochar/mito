import React from "react";
import { Gene } from "../../core/cell/gene";
import GN from "./GN";
export const GeneScaffolding = Gene.make(
  {
    name: "Scaffolding",
    levelCosts: [-2, -3, -4, -5, -8],
    levelProps: {},
    static: {
      timeToBuild: [5, 10, 15, 25, 30],
    },
    description: (_, { timeToBuild }) => (
      <>
        This cell takes <GN value={timeToBuild!} /> seconds longer to grow.
      </>
    ),
  },
  {},
  () => {}
);
export type GeneScaffolding = typeof GeneScaffolding;
