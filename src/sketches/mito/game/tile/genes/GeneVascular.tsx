import { Cell } from "../../../../../core/cell/cell";
import { Gene } from "../../../../../core/cell/chromosome";
/**
 * Vascular cells will connect to other neighboring Vascular cells.
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
    description: ({ diffusionRate }) => `Diffuses water to other Vascular cells with rate ${diffusionRate}.`,
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
export type GeneVascular = typeof GeneVascular;
