import Chromosome from "./chromosome";
import { GeneAttractsWater, GeneInventory, GeneLiving } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";
import { GenePhotosynthesis } from "./genes/GenePhotosynthesis";
import { CellType } from "./genome";

export const chromosomeLeaf = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(3),
  GeneObstacle.level(0),
  GenePhotosynthesis.level(1),
  GeneAttractsWater.level(3)
);

export const cellTypeLeaf: CellType = {
  name: "Leaf",
  chromosome: chromosomeLeaf,
  geneSlots: 10,
  interaction: {
    type: "give",
    resources: "water take sugar",
  },
};
