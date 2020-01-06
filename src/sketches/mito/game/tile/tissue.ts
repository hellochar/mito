import { Vector2 } from "three";
import { World } from "../world";
import { Cell } from "./cell";
import Chromosome from "./chromosome";
import { GeneInventory, GeneLiving } from "./genes";

export const chromosomeTissue = new Chromosome(GeneLiving.level(2), GeneInventory.level(2));

export class Tissue extends Cell {
  static displayName = "Tissue";
  constructor(pos: Vector2, world: World, chromosome: Chromosome = chromosomeTissue) {
    super(pos, world, chromosome);
  }
}
