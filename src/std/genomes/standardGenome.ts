import { Color, Vector2 } from "three";
import Chromosome from "../../core/cell/chromosome";
import Genome, { CellType } from "../../core/cell/genome";
import { GeneAttractsWater, GeneEnergyTransfer, GeneInventory, GeneLiving, GeneSoilAbsorption } from "../genes";
import { GeneAttractsSugar } from "../genes/GeneAttractsSugar";
import { GeneCannotFreeze } from "../genes/GeneCannotFreeze";
import { GeneObstacle } from "../genes/GeneObstacle";
import { GenePhotosynthesis } from "../genes/GenePhotosynthesis";
import { GeneFruit } from "../genes/GeneReproducer";
import { GeneTransport } from "../genes/GeneTransport";

const cellTypeTissue = new CellType(
  "Tissue",
  0,
  new Chromosome(GeneLiving.level(2), GeneInventory.level(3), GeneEnergyTransfer.level(1)),
  {
    texturePosition: new Vector2(1, 1),
    color: new Color(0x30ae25),
  },
  {
    type: "take",
    resources: "water and sugar",
  }
);

const cellTypeLeaf = new CellType(
  "Leaf",
  0,
  new Chromosome(
    GeneLiving.level(2),
    GeneInventory.level(3),
    GeneObstacle.level(0),
    GenePhotosynthesis.level(1),
    GeneAttractsWater.level(3)
  ),
  {
    color: new Color("white"),
    texturePosition: new Vector2(2, 1),
  },
  {
    type: "give",
    resources: "water take sugar",
  }
);

const cellTypeRoot = new CellType(
  "Root",
  0,
  new Chromosome(GeneLiving.level(2), GeneInventory.level(4), GeneObstacle.level(0), GeneSoilAbsorption.level(2)),
  {
    color: new Color("white"),
    texturePosition: new Vector2(3, 1),
  },
  {
    type: "take",
    resources: "water and sugar",
  }
);

const cellTypeTransport = new CellType(
  "Transport",
  0,
  new Chromosome(GeneLiving.level(3), GeneInventory.level(3), GeneTransport.level(2), GeneEnergyTransfer.level(2)),
  {
    texturePosition: new Vector2(1, 1),
    color: new Color(0x30ae25),
  },
  {
    type: "take",
    resources: "water and sugar",
  }
);

const cellTypeFruit = new CellType(
  "Fruit",
  0,
  new Chromosome(
    GeneLiving.level(2),
    GeneInventory.level(0),
    GeneObstacle.level(0),
    GeneCannotFreeze.level(0),
    GeneFruit.level(0),
    GeneAttractsSugar.level(1),
    GeneAttractsWater.level(1)
  ),
  {
    texturePosition: new Vector2(0, 2),
  },
  {
    type: "give",
    resources: "water and sugar",
  }
);

export const standardGenome = new Genome([
  cellTypeTissue,
  cellTypeLeaf,
  cellTypeRoot,
  cellTypeTransport,
  cellTypeFruit,
]);
