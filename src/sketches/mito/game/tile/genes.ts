import { Vector2 } from "three";
import { Cell } from "./cell";
import { Gene } from "./chromosome";
import { Soil } from "./soil";

/**
 * Vascular cells will connect to other adjacent Vascular cells.
 * Water in a Vascular cell will do two things:
 * a) Adhesion - Water will be pulled into this Cell.
 * b) Cohesion - Water will move to be near other Water.
 */
export const GeneVascular = Gene.make(
  {
    name: "Vascular",
    levelCosts: [1, 2, 3, 5, 8],
    levelProps: {
      diffusionRate: [0.01, 0.05, 0.1, 0.2, 0.4],
    },
  },
  {},
  (dt, { cell, props: { diffusionRate } }) => {
    const neighbors = Array.from(cell.world.tileNeighbors(cell.pos).values());
    const vascularNeighbors = neighbors.filter((t) => t instanceof Cell && t.chromosome.has(GeneVascular));
    for (const n of vascularNeighbors) {
      cell.diffuseWater(n, dt, diffusionRate);
    }
  }
);

export const GeneLiving = Gene.make(
  {
    name: "Living",
    levelCosts: [4, 2, 0, -2, -5],
    levelProps: {
      secondsPerUpkeep: [720, 600, 480, 240, 120],
    },
  },
  {},
  (dt, { cell, props: { secondsPerUpkeep } }) => {
    cell.energy -= (1 / secondsPerUpkeep) * cell.tempo * dt;
  }
);

export const GeneSoilAbsorb = Gene.make(
  {
    name: "Soil Absorption",
    levelCosts: [4, 6, 8, 10, 12],
    levelProps: {
      secondsPerAbsorb: [20, 10, 5, 3, 2],
    },
  },
  { cooldown: 0, totalSucked: 0, activeNeighbors: [] as Vector2[] },
  (dt, { cell, state, props: { secondsPerAbsorb } }) => {
    if (state.cooldown <= 0) {
      state.activeNeighbors = [];
      state.totalSucked += absorbWater(state.activeNeighbors, cell);
      state.cooldown += secondsPerAbsorb;
    }
    state.cooldown -= cell.tempo * dt;
  }
);

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
