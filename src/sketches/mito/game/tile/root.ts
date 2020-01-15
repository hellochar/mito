import Chromosome from "./chromosome";
import { GeneInventory, GeneLiving, GeneSoilAbsorption } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";
import { CellType } from "./genome";

export const chromosomeRoot = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(4),
  GeneObstacle.level(0),
  GeneSoilAbsorption.level(2)
);

export const cellTypeRoot: CellType = {
  name: "Root",
  chromosome: chromosomeRoot,
  geneSlots: 10,
  interaction: {
    type: "take",
    resources: "water and sugar",
  },
};
