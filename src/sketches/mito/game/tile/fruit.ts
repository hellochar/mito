import { Vector2 } from "three";
import { traitMod } from "../../../../evolution/traits";
import { Inventory } from "../../inventory";
import { FRUIT_NEEDED_RESOURCES, FRUIT_TIME_TO_MATURE } from "../constants";
import { World } from "../world";
import { Cell } from "./cell";
import { CellEffect, FreezeEffect } from "./cellEffect";
import Chromosome from "./chromosome";
import { GeneInventory, GeneLiving } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";

export const chromosomeFruit = new Chromosome(GeneLiving.level(2), GeneInventory.level(0), GeneObstacle.level(0));
export class Fruit extends Cell {
  static displayName = "Fruit";
  public neededResources: number;
  public committedResources: Inventory; // = new Inventory(Fruit.neededResources, this);
  public timeMatured?: number;
  static timeToBuild = 0;
  public secondsToMature: number; // = TIME_PER_SEASON / 3 * 2; // takes two months to mature
  get oneSecondCommitMax() {
    return this.neededResources / this.secondsToMature;
  }
  constructor(pos: Vector2, world: World) {
    super(pos, world, chromosomeFruit);
    this.neededResources =
      Math.ceil(traitMod(world.traits.fruitNeededResources, FRUIT_NEEDED_RESOURCES, 1 / 1.5) / 2) * 2;
    this.committedResources = new Inventory(this.neededResources, this);
    this.committedResources.on("get", this.handleGetResources);
    this.secondsToMature = Math.ceil(traitMod(world.traits.fruitGrowthSpeed, FRUIT_TIME_TO_MATURE, 1 / 1.5));
  }

  handleGetResources = () => {
    if (this.timeMatured == null && this.isMature()) {
      this.timeMatured = this.world.time;
      this.committedResources.off("get", this.handleGetResources);
    }
  };

  addEffect(effect: CellEffect) {
    // disallow fruit from freezing
    if (effect instanceof FreezeEffect) {
      return;
    } else {
      super.addEffect(effect);
    }
  }

  step(dt: number) {
    super.step(dt);
    // how fast Fruit takes resources from surrounding tiles and puts it onto itself
    // to be committed. Should be pretty fast.
    const maxResourceIntake = 30 * dt * this.tempo;
    const neighbors = this.world.tileNeighbors(this.pos);
    for (const [, neighbor] of neighbors) {
      if (neighbor instanceof Cell && !(neighbor instanceof Fruit)) {
        const wantedWater = Math.min(this.neededResources / 2 - this.committedResources.water, maxResourceIntake);
        const wantedSugar = Math.min(this.neededResources / 2 - this.committedResources.sugar, maxResourceIntake);
        // aggressively take the inventory from neighbors
        neighbor.inventory.give(this.inventory, wantedWater, wantedSugar);
      }
    }
    this.commitResources(dt);
  }
  commitResources(dt: number) {
    const wantedWater = Math.min(
      this.neededResources / 2 - this.committedResources.water,
      (this.oneSecondCommitMax / 2) * dt * this.tempo
    );
    const wantedSugar = Math.min(
      this.neededResources / 2 - this.committedResources.sugar,
      (this.oneSecondCommitMax / 2) * dt * this.tempo
    );
    this.inventory.give(this.committedResources, wantedWater, wantedSugar);
  }

  stepEatSugar() {
    return 0;
  }

  getPercentMatured() {
    const r = this.committedResources;
    return (r.sugar + r.water) / r.capacity;
  }

  isMature() {
    // add 1 buffer for fp errors
    return this.committedResources.water + this.committedResources.sugar >= this.neededResources - 1;
  }
}
