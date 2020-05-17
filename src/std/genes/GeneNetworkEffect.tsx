import { Cell } from "core/cell";
import React from "react";
import { Gene } from "../../core/cell/gene";

const NEIGHBORS_NEEDED = 6;
const PERCENT_FASTER = 1;

export const GeneNetworkEffect = Gene.make({
  name: "Network Effect",
  levelCosts: [2],
  levelProps: {
    energyUpkeep: 1 / 1200,
  },
  description: () => (
    <>
      If this cell has {NEIGHBORS_NEEDED} or more neighbors (diagonals included), it operates{" "}
      <b>{PERCENT_FASTER * 100}%</b> faster.
    </>
  ),
  dynamic(cell, properties) {
    const neighbors = cell.world.tileNeighbors(cell.pos);
    let numCells = 0;
    for (const n of neighbors.array) {
      if (Cell.is(n)) {
        numCells++;
      }
    }

    if (numCells >= NEIGHBORS_NEEDED) {
      properties.tempo *= 1 + PERCENT_FASTER;
    }
    return properties;
  },
});
export type GeneNetworkEffect = typeof GeneNetworkEffect;
