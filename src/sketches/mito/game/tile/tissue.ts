import { Vector2 } from "three";
import { World } from "../world";
import { Cell } from "./cell";
import Chromosome from "./chromosome";
import { GeneInventory, GeneLiving } from "./genes";
import { GeneEnergyTransfer } from "./genes/GeneEnergyTransfer";
import { GeneMetabolism } from "./genes/GeneMetabolism";

export const chromosomeTissue = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(3),
  GeneMetabolism.level(2),
  GeneEnergyTransfer.level(1)
);

export class Tissue extends Cell {
  static displayName = "Tissue";
  constructor(pos: Vector2, world: World, chromosome: Chromosome = chromosomeTissue) {
    super(pos, world, chromosome);
  }
}
