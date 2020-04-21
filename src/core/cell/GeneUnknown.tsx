import React from "react";
import { Gene } from "../../core/cell/gene";

export const GeneUnknown = Gene.make({
  name: "Unknown",
  levelCosts: [0, 0, 0, 0, 0],
  levelProps: {},
  description: () => <>Oops, this Gene couldn't be loaded!</>,
});
export type GeneUnknown = typeof GeneUnknown;
