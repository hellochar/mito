import React from "react";
import { Gene } from "../../core/cell/gene";
export const GeneObstacle = Gene.make(
  {
    name: "Obstacle",
    levelCosts: [-3],
    levelProps: {},
    static: {
      isObstacle: true,
    },
    description: () => <>You may not walk on or build off of this Cell.</>,
  },
  {},
  () => {}
);
export type GeneObstacle = typeof GeneObstacle;
