import React from "react";
import { Gene } from "../../core/cell/gene";

export function makeGeneUnknown(name: string) {
  return Gene.make({
    isHidden: true,
    name: `Unknown (${name})`,
    levelCosts: [0, 0, 0, 0, 0],
    levelProps: {},
    description: () => <>Oops, this Gene couldn't be loaded!</>,
  });
}
