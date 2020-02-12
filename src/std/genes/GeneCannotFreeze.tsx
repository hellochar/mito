import { Gene } from "../../core/cell/chromosome";

export const GeneCannotFreeze = Gene.make(
  {
    name: "Cannot Freeze",
    levelCosts: [7],
    levelProps: {},
    static: {
      cantFreeze: true,
    },
    description: () => null,
  },
  {},
  () => {}
);
