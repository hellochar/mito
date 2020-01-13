import { Gene } from "../chromosome";

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
