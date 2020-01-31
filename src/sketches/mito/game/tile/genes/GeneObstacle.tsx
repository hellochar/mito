import React from "react";
import { Gene } from "../chromosome";
export const GeneObstacle = Gene.make(
  {
    name: "Obstacle",
    levelCosts: [-4],
    levelProps: {},
    static: {
      isObstacle: true,
    },
    description: () => <>You may not walk on this Cell.</>,
  },
  {},
  () => {}
);
export type GeneObstacle = typeof GeneObstacle;