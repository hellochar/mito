import React from "react";
import { Gene } from "../../core/cell/gene";

export const GeneFluidMembrane = Gene.make({
  name: "Fluid Membrane",
  levelCosts: [1, 1, 1, 1, 3],
  levelProps: {
    energyUpkeep: 1 / 1200,
  },
  static: {
    moveSpeed: [1.2, 1.3, 1.4, 1.5, 2],
  },
  description: (_, { moveSpeed }) => (
    <>
      Move <b>{(moveSpeed! - 1) * 100}%</b> faster over this Cell.
    </>
  ),
});
export type GeneFluidMembrane = typeof GeneFluidMembrane;
