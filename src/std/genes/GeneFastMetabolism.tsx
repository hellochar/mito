import { nf } from "common/formatters";
import React from "react";
import { Gene } from "../../core/cell/gene";

export const GeneFastMetabolism = Gene.make({
  name: "Fast Metabolism",
  levelCosts: [1, 1, 1, 1, 3],
  levelProps: {
    energyUpkeep: 1 / 1500,
  },
  static: {
    // 1.1 ^ x
    tempo: [1.1, 1.21, 1.331, 1.4641, 1.771561],
  },
  description: (_, { tempo }) => (
    <>
      Cell operates <b>{nf((tempo! - 1) * 100, 3)}%</b> faster. <i>(Energy upkeep is also increased)</i>.
    </>
  ),
});
export type GeneFastMetabolism = typeof GeneFastMetabolism;
