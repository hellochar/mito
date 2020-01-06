import { Gene } from "../chromosome";
export const GeneLiving = Gene.make(
  {
    name: "Living",
    levelCosts: [4, 2, 0, -2, -5],
    levelProps: {
      secondsPerUpkeep: [720, 600, 480, 240, 120],
    },
    description: ({ secondsPerUpkeep }) => `Uses 100% of its energy every ${secondsPerUpkeep} seconds.`,
  },
  {},
  (dt, { cell, props: { secondsPerUpkeep } }) => {
    cell.energy -= (1 / secondsPerUpkeep) * cell.tempo * dt;
  }
);
export type GeneLiving = typeof GeneLiving;
