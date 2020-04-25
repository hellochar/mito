import React from "react";
import { Gene } from "../../core/cell/gene";

export const GeneSlowMetabolism = Gene.make({
  name: "Slow Metabolism",
  levelCosts: [1, 1, 1, 1, 3],
  levelProps: {
    energyUpkeep: 1 / 1500,
  },
  static: {
    // 1.1 ^ -x
    tempo: [0.909, 0.826, 0.751, 0.683, 0.5644],
  },
  description: (_, { tempo }) => (
    <>
      Cell operates <b>{(1 - tempo!) * 100}%</b> slower. <i>(Energy upkeep is also decreased)</i>.
    </>
  ),
});
export type GeneSlowMetabolism = typeof GeneSlowMetabolism;
