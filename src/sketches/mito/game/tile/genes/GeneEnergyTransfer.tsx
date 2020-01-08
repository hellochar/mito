import React from "react";
import GN from "sketches/mito/ui/GN";
import { Cell } from "../cell";
import { Gene } from "../chromosome";

export const GeneEnergyTransfer = Gene.make(
  {
    name: "Energy Transfer",
    levelCosts: [1, 3, 4, 5, 7],
    levelProps: {
      differenceThreshold: [0.08, 0.04, 0.02, 0.01, 0.005],
    },
    description: ({ differenceThreshold }) => (
      <>
        Give Energy to neighboring Cells until they're within{" "}
        <GN value={differenceThreshold * 100} fractionDigits={1} />% energy difference of this Cell.
      </>
    ),
  },
  {},
  (dt, { cell, props: { differenceThreshold } }) => {
    const tileNeighbors = cell.world.tileNeighbors(cell.pos);
    for (const [, neighbor] of tileNeighbors) {
      if (neighbor.pos.manhattanDistanceTo(cell.pos) > 1 || !(neighbor instanceof Cell)) continue;
      maybeGiveEnergy(dt, cell, neighbor, differenceThreshold);
    }
  }
);

const ENERGY_GIVE_RATE = 0.2; // 20% energy per second

function maybeGiveEnergy(dt: number, cell: Cell, neighbor: Cell, differenceThreshold: number) {
  const difference = cell.energy - neighbor.energy;
  if (difference > differenceThreshold) {
    const energyToGive = Math.min(difference - differenceThreshold, ENERGY_GIVE_RATE * dt);
    // safe method but lower upper bound on equalization rate
    // energyTransfer = Math.floor((neighbor.energy - this.energy) / energeticNeighbors.length);
    // this may be unstable w/o double buffering
    cell.energy -= energyToGive;
    neighbor.energy += energyToGive;
    cell.world.logEvent({ type: "cell-transfer-energy", from: cell, to: neighbor, amount: energyToGive });
  }
}

export type GeneEnergyTransfer = typeof GeneEnergyTransfer;
