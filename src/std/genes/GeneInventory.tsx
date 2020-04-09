import { ResourceIcon } from "game/ui/common/ResourceIcon";
import React from "react";
import GN from "std/genes/GN";
import { Gene } from "../../core/cell/gene";
export const GeneInventory = Gene.make(
  {
    name: "Inventory",
    levelCosts: [1, 2, 3, 4, 5],
    levelProps: {},
    static: {
      inventoryCapacity: [2, 3, 5, 8, 11],
    },
    description: (_, { inventoryCapacity }) => (
      <>
        Allows cell to hold <ResourceIcon name="water" />
        <ResourceIcon name="sugar" />. Capacity +<GN value={inventoryCapacity!} />.
      </>
    ),
  },
  {},
  () => {}
);
export type GeneInventory = typeof GeneInventory;
