import { GeneScaffolding } from "std/genes/GeneScaffolding";
import { Color, Vector2 } from "three";
import Chromosome from "../../core/cell/chromosome";
import Genome, { CellType } from "../../core/cell/genome";
import { GeneEnergyTransfer, GeneInventory, GeneLiving, GeneMetabolism, GeneSoilAbsorption } from "../genes";
import { GeneObstacle } from "../genes/GeneObstacle";
import { GenePhotosynthesis } from "../genes/GenePhotosynthesis";
import { GeneSeed } from "../genes/GeneReproducer";

const cellTypeTissue = new CellType(
  "Tissue",
  0,
  new Chromosome(GeneLiving.level(2), GeneInventory.level(3), GeneMetabolism.level(2), GeneEnergyTransfer.level(1)),
  {
    texturePosition: new Vector2(1, 1),
    color: new Color(0x30ae25),
  },
  {
    type: "give",
    resources: "sugar",
  }
);

const cellTypeLeaf = new CellType(
  "Leaf",
  0,
  new Chromosome(GeneLiving.level(2), GeneObstacle.level(0), GeneInventory.level(3), GenePhotosynthesis.level(1)),
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
  new Chromosome(
    GeneLiving.level(2),
    GeneScaffolding.level(1),
    GeneInventory.level(4),
    // GeneObstacle.level(0),
    GeneSoilAbsorption.level(2)
  ),
  {
    color: new Color("white"),
    texturePosition: new Vector2(3, 1),
  },
  {
    type: "take",
    resources: "water and sugar",
  }
);

const cellTypeSeed = new CellType(
  "Seed",
  0,
  new Chromosome(GeneLiving.level(2), GeneObstacle.level(0), GeneInventory.level(3), GeneSeed.level(2)),
  {
    texturePosition: new Vector2(1, 4),
  },
  {
    type: "give",
    resources: "water and sugar",
  }
);

export const tutorialGenome = new Genome([cellTypeTissue, cellTypeLeaf, cellTypeRoot, cellTypeSeed]);
