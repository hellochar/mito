import { Vector2 } from "three";
import { World } from "../world";
import { Cell, CellArgs } from "./cell";
import Chromosome from "./chromosome";
import { GeneAttractsWater, GeneInventory, GeneLiving } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";
import { GenePhotosynthesis } from "./genes/GenePhotosynthesis";

export const chromosomeLeaf = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(3),
  GeneObstacle.level(0),
  GenePhotosynthesis.level(1),
  GeneAttractsWater.level(3)
);

export class Leaf extends Cell {
  static displayName = "Leaf";

  constructor(pos: Vector2, world: World, args?: CellArgs) {
    super(pos, world, chromosomeLeaf, args);
  }
}
