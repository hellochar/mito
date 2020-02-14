import React from "react";
import GN from "std/genes/GN";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/chromosome";

export const GeneMetabolism = Gene.make(
  {
    name: "Metabolism",
    levelCosts: [0, 1, 3, 6, 10],
    levelProps: {
      energyPerSugar: [0.25, 0.5, 1, 1.5, 2],
    },
    description: ({ energyPerSugar }) => (
      <>
        <p>
          Convert 1 Sugar into <GN value={energyPerSugar * 100} sigFigs={3} />% energy.
        </p>
        <p>Starts below 95% energy. Restores {EAT_ENERGY_PER_SECOND * 100}% energy per second.</p>
      </>
    ),
  },
  {},
  (dt, { cell, props: { energyPerSugar } }) => {
    let maxEnergyToEat = getMaxEnergyToEat(cell, dt);
    // eat from self
    if (maxEnergyToEat > 0) {
      // if this number goes up, we become less energy efficient
      // if this number goes down, we are more energy efficient
      maxEnergyToEat -= stepEatSugar(cell, maxEnergyToEat, energyPerSugar);
    }
  }
);
export type GeneMetabolism = typeof GeneMetabolism;

const EAT_ENERGY_PER_SECOND = 0.25;

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
