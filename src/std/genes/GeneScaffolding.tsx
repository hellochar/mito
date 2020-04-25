import React from "react";
import { Gene } from "../../core/cell/gene";
import GN from "./GN";
export const GeneScaffolding = Gene.make(
  {
    name: "Scaffolding",
    levelCosts: [-3, -4, -5, -6, -10],
    levelProps: {},
    static: {
      timeToBuild: [3, 4, 5, 6, 15],
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
