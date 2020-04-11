import { Cell } from "core/cell";
import React from "react";
import { Gene } from "../../core/cell/gene";

const NEIGHBORS_NEEDED = 6;
const PERCENT_FASTER = 1;

export const GeneNetworkEffect = Gene.make({
  name: "Network Effect",
  levelCosts: [4],
  levelProps: {},
  description: () => (
    <>
      If this cell has {NEIGHBORS_NEEDED} or more neighbors (diagonals included) of the same type, it operates{" "}
      <b>{PERCENT_FASTER * 100}%</b> faster.
    </>
  ),
  dynamic(cell, properties) {
    const neighbors = Array.from(cell.world.tileNeighbors(cell.pos).values());
    let numSameType = 0;
    for (const n of neighbors) {
      if (n instanceof Cell && n.type === cell.type) {
        numSameType++;
      }
    }

    if (numSameType >= NEIGHBORS_NEEDED) {
      properties.tempo *= 1 + PERCENT_FASTER;
    }
    return properties;
  },
});
export type GeneNetworkEffect = typeof GeneNetworkEffect;
