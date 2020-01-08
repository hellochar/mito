import { Vector2 } from "three";
import { World } from "../world";
import { Cell } from "./cell";
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

  constructor(pos: Vector2, world: World) {
    super(pos, world, chromosomeLeaf);
  }

  public step(dt: number) {
    super.step(dt);
    // const neighbors = this.world.tileNeighbors(this.pos);

    // for (const [, tile] of neighbors) {
    //   // pull water from nearby sources
    //   if (tile instanceof Leaf) {
    //     tile.diffuseWater(this, dt, this.diffusionWater * 5);
    //   }
    // }
  }
}
