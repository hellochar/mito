import { Vector2 } from "three";
import { World } from "../world";
import { Cell, CellArgs } from "./cell";
import Chromosome from "./chromosome";
import { GeneEnergyTransfer, GeneInventory, GeneLiving, GeneMetabolism } from "./genes";

export const chromosomeTissue = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(3),
  GeneMetabolism.level(2),
  GeneEnergyTransfer.level(1)
);

export class Tissue extends Cell {
  static displayName = "Tissue";
  constructor(pos: Vector2, world: World, args?: CellArgs) {
    super(pos, world, chromosomeTissue, args);
  }
}
