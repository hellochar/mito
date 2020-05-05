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
      energyUpkeep: 1 / 800,
    },
    description: () => (
      <>
        <p>
          Eats 1<RI s /> for 100% energy.
        </p>
        <p>Shares energy with other cells.</p>
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

    // share energy
    const tileNeighbors = cell.world.tileNeighbors(cell.pos);
    for (const neighbor of tileNeighbors.values()) {
      if (neighbor instanceof Cell) {
        maybeGiveEnergy(dt, cell, neighbor, 0.05);
      }
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
