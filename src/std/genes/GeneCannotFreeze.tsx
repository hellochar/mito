import { Gene } from "../../core/cell/gene";

export const GeneCannotFreeze = Gene.make(
  {
    name: "Cannot Freeze",
    levelCosts: [3],
    levelProps: {},
    static: {
      cantFreeze: true,
      energyUpkeep: 1 / 600,
    },
    description: () => null,
  },
  {},
  () => {}
);
