import { Vector2 } from "three";
import { traitMod } from "../../../../evolution/traits";
import { Inventory } from "../../inventory";
import { ROOT_TIME_BETWEEN_ABSORPTIONS, TISSUE_INVENTORY_CAPACITY } from "../constants";
import { Interactable } from "../interactable";
import { World } from "../world";
import { Cell } from "./cell";
import Genome from "./genome";
import { Soil } from "./soil";

const genomeRoot = new Genome();

export class Root extends Cell implements Interactable {
  static displayName = "Root";
  public isObstacle = true;
  public activeNeighbors: Vector2[] = [];
  public inventory = new Inventory(TISSUE_INVENTORY_CAPACITY, this);
  cooldown = 0;
  public totalSucked = 0;
  constructor(pos: Vector2, world: World) {
    super(pos, world, genomeRoot);
  }
  interact(dt: number) {
    super.interact(dt);
    // give water to player
    const player = this.world.player;
    this.inventory.give(player.inventory, 7.5 * dt, 0);
    return true;
  }

  public step(dt: number) {
    super.step(dt);
    if (this.cooldown <= 0) {
      this.absorbWater();
      this.cooldown += traitMod(this.world.traits.rootAbsorption, ROOT_TIME_BETWEEN_ABSORPTIONS, 1 / 1.5);
    }
    this.cooldown -= this.tempo * dt;
  }

  // diffuseWater(giver: Tile, dt: number, diffusionRate = this.diffusionWater) {
  //   if (giver instanceof Root) {
  //     diffusionRate *= 5;
  //   }
  //   return super.diffuseWater(giver, dt, diffusionRate);
  // }

  private absorbWater() {
    this.activeNeighbors = [];
    const neighbors = this.world.tileNeighbors(this.pos);
    let doneOnce = false;
    for (const [dir, tile] of neighbors) {
      if (tile instanceof Soil) {
        this.activeNeighbors.push(dir);
        if (!doneOnce) {
          const { water } = tile.inventory.give(this.inventory, 1, 0);
          this.totalSucked += water;
          if (water > 0) {
            doneOnce = true;
          }
        }
      }
    }
  }
}
