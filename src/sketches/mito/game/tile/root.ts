import { Vector2 } from "three";
import { Inventory } from "../../inventory";
import { TISSUE_INVENTORY_CAPACITY } from "../constants";
import { Interactable } from "../interactable";
import { World } from "../world";
import { Cell } from "./cell";
import Chromosome from "./chromosome";
import { GeneSoilAbsorb } from "./genes";

const chromosomeRoot = new Chromosome(GeneSoilAbsorb.level(2));

export class Root extends Cell implements Interactable {
  static displayName = "Root";
  public isObstacle = true;
  public inventory = new Inventory(TISSUE_INVENTORY_CAPACITY, this);
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
