import React from "react";
import GN from "sketches/mito/ui/GN";
import { Cell } from "../cell";
import { Gene } from "../chromosome";

export const GeneMetabolism = Gene.make(
  {
    name: "Metabolism",
    levelCosts: [0, 1, 3, 6, 10],
    levelProps: {
      energyPerSugar: [0.25, 0.5, 1, 1.5, 2],
    },
    description: ({ energyPerSugar }) => (
      <>
        Convert 1 Sugar into <GN value={energyPerSugar * 100} sigFigs={3} />% energy.
        <br />
        Starts below 95% energy. Restores 20% energy per second.
      </>
    ),
  },
  {},
  (dt, { cell, props: { energyPerSugar } }) => {
    let maxEnergyToEat = getMaxEnergyToEat(cell, cell.tempo * dt);
    // eat from self
    if (maxEnergyToEat > 0) {
      // if this number goes up, we become less energy efficient
      // if this number goes down, we are more energy efficient
      maxEnergyToEat -= stepEatSugar(cell, maxEnergyToEat, energyPerSugar);
    }
  }
);
export type GeneMetabolism = typeof GeneMetabolism;

const EAT_ENERGY_PER_SECOND = 0.2;

function getMaxEnergyToEat(cell: Cell, dt: number) {
  const hunger = 1 - cell.energy;
  if (hunger < 0.05) {
    return 0;
  }
  return Math.min(hunger, EAT_ENERGY_PER_SECOND * dt);
}

function stepEatSugar(cell: Cell, maxEnergyToEat: number, energyPerSugar: number): number {
  const sugarToEat = Math.min(maxEnergyToEat / energyPerSugar, cell.inventory.sugar);
  // eat if we're hungry
  if (sugarToEat > 0) {
    cell.inventory.add(0, -sugarToEat);
    const gotEnergy = sugarToEat * energyPerSugar;
    cell.energy += gotEnergy;
    if (gotEnergy > 0) {
      cell.world.logEvent({ type: "cell-eat", who: cell });
    }
    return gotEnergy;
  }
  return 0;
}
