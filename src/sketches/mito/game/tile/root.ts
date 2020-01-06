import { Vector2 } from "three";
import { Interactable } from "../interactable";
import { World } from "../world";
import { Cell } from "./cell";
import Chromosome from "./chromosome";
import { GeneInventory, GeneSoilAbsorption } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";

export const chromosomeRoot = new Chromosome(
  GeneInventory.level(4),
  GeneObstacle.level(0),
  GeneSoilAbsorption.level(2)
);

export class Root extends Cell implements Interactable {
  static displayName = "Root";
  constructor(pos: Vector2, world: World) {
    super(pos, world, chromosomeRoot);
  }

  interact(dt: number) {
    super.interact(dt);
    // give water to player
    const player = this.world.player;
    this.inventory.give(player.inventory, 7.5 * dt, 0);
    return true;
  }
}
