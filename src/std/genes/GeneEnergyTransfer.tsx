import React from "react";
import GN from "std/genes/GN";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/chromosome";

export const GeneEnergyTransfer = Gene.make(
  {
    name: "Energy Transfer",
    levelCosts: [1, 3, 4, 5, 7],
    levelProps: {
      differenceThreshold: [0.08, 0.04, 0.02, 0.01, 0.005],
    },
    description: ({ differenceThreshold }) => (
      <>
        <p>
          Give energy to neighboring Cells until they're within <GN value={differenceThreshold * 100} sigFigs={3} />%
          energy difference of this Cell.
        </p>
        <p>Gives up to {ENERGY_GIVE_RATE * 100}% energy per second.</p>
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

const ENERGY_GIVE_RATE = 0.25;

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
