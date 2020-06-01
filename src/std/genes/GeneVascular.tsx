import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/gene";
/**
 * Vascular cells will connect to other neighboring Vascular cells.
 * Water in a Vascular cell will do two things:
 * a) Adhesion - Water will be pulled into this Cell.
 * b) Cohesion - Water will move to be near other Water.
 */
export const GeneVascular = Gene.make(
  {
    name: "Vascular",
    levelCosts: [1, 1, 1, 1, 1],
    levelProps: {
      diffusionRate: [0.1, 0.15, 0.2, 0.25, 5],
    },
    static: {
      energyUpkeep: 1 / 1200,
    },
    description: ({ diffusionRate }) => `Diffuses water to other Vascular cells with rate ${diffusionRate}.`,
  },
  {},
  (dt, { cell, props: { diffusionRate } }) => {
    const neighbors = cell.world.tileNeighbors(cell.pos);
    const vascularNeighbors = neighbors.array.filter((t) => Cell.is(t) && t.chromosome.has(GeneVascular));
    for (const n of vascularNeighbors) {
      cell.diffuseWater(n, dt, diffusionRate);
    }
  }
);
export type GeneVascular = typeof GeneVascular;
