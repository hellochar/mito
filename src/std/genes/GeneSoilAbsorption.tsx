import { Cell } from "core/cell";
import { Soil } from "core/tile";
import { ResourceIcon } from "game/ui/common/ResourceIcon";
import React from "react";
import GN from "std/genes/GN";
import { Vector2 } from "three";
import { Gene } from "../../core/cell/gene";

export interface SoilAbsorptionState {
  cooldown: number;
  totalSucked: number;
  activeNeighbors: Vector2[];
}

export const GeneSoilAbsorption = Gene.make<SoilAbsorptionState>(
  {
    name: "Soil Absorption",
    levelCosts: [3, 5, 7, 9, 11],
    levelProps: {
      secondsPerAbsorb: [15, 12, 9.6, 7.68, 6.14],
    },
    static: {
      energyUpkeep: 1 / 800,
    },
    description: ({ secondsPerAbsorb }) => (
      <>
        Absorb 1<ResourceIcon name="water" /> every <GN value={secondsPerAbsorb} /> seconds from every neighboring Soil.
      </>
    ),
  },
  { cooldown: 0, totalSucked: 0, activeNeighbors: [] },
  (dt, { cell, state, props: { secondsPerAbsorb } }) => {
    if (state.cooldown <= 0) {
      state.activeNeighbors = [];
      state.totalSucked += absorbWater(state.activeNeighbors, cell);
      state.cooldown += secondsPerAbsorb;
    }
    state.cooldown -= dt;
  }
);
export type GeneSoilAbsorption = typeof GeneSoilAbsorption;

function absorbWater(activeNeighbors: Vector2[], cell: Cell) {
  const neighbors = cell.world.tileNeighbors(cell.pos);
  let totalSucked = 0;
  for (const [dir, tile] of neighbors) {
    if (tile instanceof Soil) {
      activeNeighbors.push(dir);
      const { water } = tile.inventory.give(cell.inventory, 1, 0);
      totalSucked += water;
    }
  }
  return totalSucked;
}
