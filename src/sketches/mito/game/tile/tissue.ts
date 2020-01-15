import Chromosome from "./chromosome";
import { GeneEnergyTransfer, GeneInventory, GeneLiving, GeneMetabolism } from "./genes";
import { CellType } from "./genome";

export const chromosomeTissue = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(3),
  GeneMetabolism.level(2),
  GeneEnergyTransfer.level(1)
);

export const cellTypeTissue: CellType = {
  name: "Tissue",
  chromosome: chromosomeTissue,
  geneSlots: 10,
  interaction: {
    type: "take",
    resources: "water and sugar",
  },
};
