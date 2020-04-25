import { Cell } from "core/cell";
import React from "react";
import { Gene } from "../../core/cell/gene";
import RI from "./RI";
export const GeneLiving = Gene.make(
  {
    name: "Living",
    levelCosts: [-3, -4, -5, -6, -7],
    levelProps: {},
    static: {
      inventoryCapacity: 5,
      energyUpkeep: 1 / 1200,
    },
    description: () => (
      <>
        <p>
          This cell can eat 1<RI s /> for 100% energy.
        </p>
        <p>
          Allows cell to hold <RI w />
          <RI s />. Resource Capacity +5.
        </p>
      </>
    ),
  },
  {},
  (dt, { cell }) => {
    let maxEnergyToEat = getMaxEnergyToEat(cell, dt);
    // eat from self
    if (maxEnergyToEat > 0) {
      // if this number goes up, we become less energy efficient
      // if this number goes down, we are more energy efficient
      maxEnergyToEat -= stepEatSugar(cell, maxEnergyToEat, ENERGY_PER_SUGAR);
    }
  }
);
export type GeneLiving = typeof GeneLiving;

const ENERGY_PER_SUGAR = 1;
const EAT_ENERGY_PER_SECOND = 0.333;

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
