import Chromosome from "./chromosome";
import { GeneAttractsWater, GeneInventory, GeneLiving } from "./genes";
import { GeneAttractsSugar } from "./genes/GeneAttractsSugar";
import { GeneCannotFreeze } from "./genes/GeneCannotFreeze";
import { GeneFruit } from "./genes/GeneFruit";
import { GeneObstacle } from "./genes/GeneObstacle";
import { CellType } from "./genome";

export const chromosomeFruit = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(0),
  GeneObstacle.level(0),
  GeneCannotFreeze.level(0),
  GeneFruit.level(0),
  GeneAttractsSugar.level(1),
  GeneAttractsWater.level(1)
);

export const cellTypeFruit: CellType = {
  name: "Fruit",
  chromosome: chromosomeFruit,
  geneSlots: 10,
  interaction: {
    type: "give",
    resources: "water and sugar",
  },
};
