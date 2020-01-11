import { Vector2 } from "three";
import { World } from "../world";
import { Cell, CellArgs } from "./cell";
import { CellEffect, FreezeEffect } from "./cellEffect";
import Chromosome from "./chromosome";
import { GeneInventory, GeneLiving } from "./genes";
import { GeneFruit } from "./genes/GeneFruit";
import { GeneObstacle } from "./genes/GeneObstacle";

export const chromosomeFruit = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(0),
  GeneObstacle.level(0),
  GeneFruit.level(0)
);
export class Fruit extends Cell {
  static displayName = "Fruit";
  static timeToBuild = 0;
  constructor(pos: Vector2, world: World, args?: CellArgs) {
    super(pos, world, chromosomeFruit, args);
  }

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
        const wantedWater = maxResourceIntake;
        const wantedSugar = maxResourceIntake;
        // aggressively take the inventory from neighbors
        neighbor.inventory.give(this.inventory, wantedWater, wantedSugar);
      }
    }
  }
}
