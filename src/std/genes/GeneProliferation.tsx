import { Cell } from "core/cell";
import React from "react";
import { Gene } from "../../core/cell/gene";

const GROWTH_RATE = 2;
const NEIGHBORING_CELLS_NEEDED = 4;

export const GeneProliferation = Gene.make({
  name: "Proliferation",
  levelCosts: [1],
  levelProps: {},
  description: () => (
    <>
      Grow at <b>{GROWTH_RATE * 100}%</b> speed if there's <b>{NEIGHBORING_CELLS_NEEDED}</b> or more neighboring Cells.
    </>
  ),
  dynamic(cell, properties) {
    // relies on the fact that cell is in the same position as the growing cell.
    const neighbors = cell.world.tileNeighbors(cell.pos);
    if (neighbors.array.filter((t) => Cell.is(t)).length >= NEIGHBORING_CELLS_NEEDED) {
      properties.timeToBuild /= GROWTH_RATE;
    }
    return properties;
  },
});
export type GeneProliferation = typeof GeneProliferation;
