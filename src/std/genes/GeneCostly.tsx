import { ResourceIcon } from "game/ui/common/ResourceIcon";
import React from "react";
import { Gene } from "../../core/cell/gene";
export const GeneCostly = Gene.make(
  {
    name: "Costly",
    levelCosts: [-3, -4, -5, -6, -10],
    levelProps: {},
    static: {
      costSugar: [2, 3, 4, 5, 8],
      costWater: [2, 3, 4, 5, 8],
    },
    description: (_, { costSugar, costWater }) => (
      <>
        This cell costs {costWater}
        <ResourceIcon name="water" />
        {costSugar}
        <ResourceIcon name="sugar" /> more to grow.
      </>
    ),
  },
  {},
  () => {}
);
export type GeneCostly = typeof GeneCostly;
