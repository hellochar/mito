import { Color, Vector2 } from "three";
import Chromosome from "../../core/cell/chromosome";
import Genome, { CellType } from "../../core/cell/genome";
import {
  GeneInventory,
  GeneLiving,
  GeneObstacle,
  GenePhotosynthesis,
  GeneScaffolding,
  GeneSeed,
  GeneSoilAbsorption,
} from "../genes";

const cellTypeTissue = new CellType(
  "Tissue",
  0,
  new Chromosome(GeneLiving.level(0)),
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
  new Chromosome(GeneLiving.level(0), GeneObstacle.level(0), GenePhotosynthesis.level(0)),
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
  new Chromosome(GeneLiving.level(0), GeneScaffolding.level(0), GeneInventory.level(0), GeneSoilAbsorption.level(0)),
  {
    color: new Color("white"),
    texturePosition: new Vector2(3, 1),
  },
  {
    type: "take",
    resources: "water and sugar",
  }
);

const cellTypeSeed = new CellType("Seed", 0, new Chromosome(GeneLiving.level(0), GeneSeed.level(0)), {
  texturePosition: new Vector2(1, 4),
});

export const tutorialGenome = new Genome([cellTypeTissue, cellTypeLeaf, cellTypeRoot, cellTypeSeed]);
