import { Air } from "core/tile";
import React from "react";
import { Gene } from "../../core/cell/gene";

const GROWTH_RATE = 2;
const NEIGHBORING_AIR_NEEDED = 5;

export const GeneAiryExpansion = Gene.make({
  name: "Airy Expansion",
  levelCosts: [1],
  levelProps: {},
  description: () => (
    <>
      Grow at <b>{GROWTH_RATE * 100}%</b> speed if there's <b>{NEIGHBORING_AIR_NEEDED}</b> or more neighboring Air
      (diagonals included).
    </>
  ),
  dynamic(cell, properties) {
    // relies on the fact that cell is in the same position as the growing cell.
    const neighbors = Array.from(cell.world.tileNeighbors(cell.pos).values());
    if (neighbors.filter((t) => Air.is(t)).length >= NEIGHBORING_AIR_NEEDED) {
      properties.timeToBuild /= GROWTH_RATE;
    }
    return properties;
  },
});
export type GeneAiryExpansion = typeof GeneAiryExpansion;
