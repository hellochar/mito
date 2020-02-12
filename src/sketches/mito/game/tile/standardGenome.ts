import { Color, Vector2 } from "three";
import Chromosome from "../../../../core/cell/chromosome";
import Genome, { CellType } from "../../../../core/cell/genome";
import {
  GeneAttractsWater,
  GeneEnergyTransfer,
  GeneInventory,
  GeneLiving,
  GeneMetabolism,
  GeneSoilAbsorption,
} from "../../../../std/genes";
import { GeneAttractsSugar } from "../../../../std/genes/GeneAttractsSugar";
import { GeneCannotFreeze } from "../../../../std/genes/GeneCannotFreeze";
import { GeneDirectionalPush } from "../../../../std/genes/GeneDirectionalPush";
import { GeneObstacle } from "../../../../std/genes/GeneObstacle";
import { GenePhotosynthesis } from "../../../../std/genes/GenePhotosynthesis";
import { GeneFruit } from "../../../../std/genes/GeneReproducer";

const cellTypeTissue: CellType = {
  name: "Tissue",
  chromosome: new Chromosome(
    GeneLiving.level(2),
    GeneInventory.level(3),
    GeneMetabolism.level(2),
    GeneEnergyTransfer.level(1)
  ),
  geneSlots: 0,
  interaction: {
    type: "take",
    resources: "water and sugar",
  },
  material: {
    texturePosition: new Vector2(1, 1),
    color: new Color(0x30ae25),
  },
};

const cellTypeLeaf: CellType = {
  name: "Leaf",
  chromosome: new Chromosome(
    GeneLiving.level(2),
    GeneInventory.level(3),
    GeneObstacle.level(0),
    GenePhotosynthesis.level(1),
    GeneAttractsWater.level(3)
  ),
  geneSlots: 0,
  interaction: {
    type: "give",
    resources: "water take sugar",
  },
  material: {
    color: new Color("white"),
    texturePosition: new Vector2(2, 1),
  },
};

const cellTypeRoot: CellType = {
  name: "Root",
  chromosome: new Chromosome(
    GeneLiving.level(2),
    GeneInventory.level(4),
    GeneObstacle.level(0),
    GeneSoilAbsorption.level(2)
  ),
  geneSlots: 0,
  interaction: {
    type: "take",
    resources: "water and sugar",
  },
  material: {
    color: new Color("white"),
    texturePosition: new Vector2(3, 1),
  },
};

const cellTypeTransport: CellType = {
  name: "Transport",
  chromosome: new Chromosome(
    GeneLiving.level(1),
    GeneInventory.level(3),
    GeneDirectionalPush.level(2),
    GeneEnergyTransfer.level(2)
  ),
  geneSlots: 0,
  interaction: {
    type: "take",
    resources: "water and sugar",
  },
  args: {
    direction: new Vector2(0, -1),
  },
  material: {
    texturePosition: new Vector2(1, 1),
    color: new Color(0x30ae25),
  },
};

const cellTypeFruit: CellType = {
  name: "Fruit",
  chromosome: new Chromosome(
    GeneLiving.level(2),
    GeneInventory.level(0),
    GeneObstacle.level(0),
    GeneCannotFreeze.level(0),
    GeneFruit.level(0),
    GeneAttractsSugar.level(1),
    GeneAttractsWater.level(1)
  ),
  geneSlots: 0,
  interaction: {
    type: "give",
    resources: "water and sugar",
  },
  material: {
    texturePosition: new Vector2(0, 2),
  },
};

export const standardGenome = new Genome([
  cellTypeTissue,
  cellTypeLeaf,
  cellTypeRoot,
  cellTypeTransport,
  cellTypeFruit,
]);
