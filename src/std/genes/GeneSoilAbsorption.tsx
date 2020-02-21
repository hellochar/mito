import React from "react";
import GN from "std/genes/GN";
import { Vector2 } from "three";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/gene";
import { Soil } from "../../core/tile/soil";

export interface SoilAbsorptionState {
  cooldown: number;
  totalSucked: number;
  activeNeighbors: Vector2[];
}

export const GeneSoilAbsorption = Gene.make<SoilAbsorptionState>(
  {
    name: "Soil Absorption",
    levelCosts: [4, 6, 8, 10, 12],
    levelProps: {
      secondsPerAbsorb: [20, 10, 5, 3, 2],
    },
    description: ({ secondsPerAbsorb }) => (
      <>
        Absorb 1 water every <GN value={secondsPerAbsorb} /> seconds from neighboring Soil.
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
  let doneOnce = false;
  let totalSucked = 0;
  for (const [dir, tile] of neighbors) {
    if (tile instanceof Soil) {
      activeNeighbors.push(dir);
      if (!doneOnce) {
        const { water } = tile.inventory.give(cell.inventory, 1, 0);
        totalSucked += water;
        if (water > 0) {
          doneOnce = true;
        }
      }
    }
  }
  return totalSucked;
}
