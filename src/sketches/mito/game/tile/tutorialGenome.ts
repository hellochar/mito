import { Color, Vector2 } from "three";
import Chromosome from "../../../../core/cell/chromosome";
import Genome, { CellType } from "../../../../core/cell/genome";
import { GeneEnergyTransfer, GeneInventory, GeneLiving, GeneMetabolism, GeneSoilAbsorption } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";
import { GenePhotosynthesis } from "./genes/GenePhotosynthesis";
import { GeneSeed } from "./genes/GeneReproducer";

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
    GenePhotosynthesis.level(1)
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
  geneSlots: 10,
  interaction: {
    type: "take",
    resources: "water and sugar",
  },
  material: {
    color: new Color("white"),
    texturePosition: new Vector2(3, 1),
  },
};

const cellTypeSeed: CellType = {
  name: "Seed",
  chromosome: new Chromosome(GeneLiving.level(2), GeneInventory.level(0), GeneSeed.level(2)),
  geneSlots: 0,
  interaction: {
    type: "give",
    resources: "water and sugar",
  },
  material: {
    texturePosition: new Vector2(1, 4),
  },
};

export const tutorialGenome = new Genome([cellTypeTissue, cellTypeLeaf, cellTypeRoot, cellTypeSeed]);
