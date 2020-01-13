import { Vector2 } from "three";
import { World } from "../world";
import { Cell, CellArgs } from "./cell";
import Chromosome from "./chromosome";
import { GeneEnergyTransfer, GeneInventory, GeneLiving, GeneMetabolism } from "./genes";
import { CellType } from "./genome";

export const chromosomeTissue = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(3),
  GeneMetabolism.level(2),
  GeneEnergyTransfer.level(1)
);

export class Tissue extends Cell {
  static displayName = "Tissue";
  constructor(pos: Vector2, world: World, args?: CellArgs) {
    super(pos, world, cellTypeTissue, args);
  }
}

export const cellTypeTissue: CellType = {
  name: "Tissue",
  chromosome: chromosomeTissue,
  geneSlots: 10,
  c: Tissue,
  interaction: {
    type: "take",
    resources: "water and sugar",
  },
};
