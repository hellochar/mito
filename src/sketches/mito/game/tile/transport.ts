import { Vector2 } from "three";
import Chromosome from "./chromosome";
import { GeneEnergyTransfer, GeneInventory, GeneLiving } from "./genes";
import { GeneDirectionalPush } from "./genes/GeneDirectionalPush";
import { CellType } from "./genome";

export const chromosomeTransport = new Chromosome(
  GeneLiving.level(1),
  GeneInventory.level(3),
  GeneDirectionalPush.level(2),
  GeneEnergyTransfer.level(2)
);

export const cellTypeTransport: CellType = {
  name: "Transport",
  chromosome: chromosomeTransport,
  geneSlots: 10,
  interaction: {
    type: "take",
    resources: "water and sugar",
  },
  args: {
    direction: new Vector2(0, -1),
  },
};
