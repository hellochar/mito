import React from "react";
import GN from "std/genes/GN";
import { Gene } from "../../core/cell/gene";
export const GeneInventory = Gene.make(
  {
    name: "Inventory",
    levelCosts: [1, 1, 2, 2, 3],
    levelProps: {},
    static: {
      inventoryCapacity: [2, 4, 7, 11, 15],
    },
    description: (_, { inventoryCapacity }) => (
      <>
        Resource Capacity +<GN value={inventoryCapacity!} />.
      </>
    ),
  },
  {},
  () => {}
);
export type GeneInventory = typeof GeneInventory;
