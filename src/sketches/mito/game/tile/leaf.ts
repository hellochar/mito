import { randRound } from "math";
import { Vector2 } from "three";
import { traitMod } from "../../../../evolution/traits";
import { canPullResources } from "../canPullResources";
import { LEAF_REACTION_TIME, LEAF_WATER_INTAKE_PER_SECOND } from "../constants";
import { World } from "../world";
import { Cell } from "./cell";
import Chromosome from "./chromosome";
import { GeneInventory, GeneLiving } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";
import { GenePhotosynthesis } from "./genes/GenePhotosynthesis";

export const chromosomeLeaf = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(2),
  GeneObstacle.level(0),
  GenePhotosynthesis.level(2)
);

export class Leaf extends Cell {
  static displayName = "Leaf";

  constructor(pos: Vector2, world: World) {
    super(pos, world, chromosomeLeaf);
  }

  reactionRate() {
    return (1 / traitMod(this.world.traits.photosynthesis, LEAF_REACTION_TIME, 1 / 1.5)) * this.tempo;
  }

  public step(dt: number) {
    super.step(dt);
    const neighbors = this.world.tileNeighbors(this.pos);

    for (const [, tile] of neighbors) {
      // pull water from nearby sources
      if (tile instanceof Leaf) {
        tile.diffuseWater(this, dt, this.diffusionWater * 5);
      } else if (canPullResources(this, tile)) {
        tile.inventory.give(this.inventory, randRound(LEAF_WATER_INTAKE_PER_SECOND * dt), 0);
      }
    }
  }
}
