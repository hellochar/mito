import { Inventory } from "sketches/mito/inventory";
import { clamp, map, randRound } from "../../../../math/index";
import { canPullResources } from "../canPullResources";
import { Tile } from "./tile";
export abstract class Soil extends Tile {
  /**
   * Soil will aggressively hold onto water below saturation;
   * after saturation, water is easily moved by forces diffusion or gravity.
   */
  abstract get saturation(): number;

  /**
   * How far away is this soil from the nearest Air?
   */
  public depth = 1000;
  isObstacle = false;

  get depthDiffusionFactor() {
    // make water move slower in deeper soil. Every depth 10, slow down gravity and fallAmount by this much
    return 1 + (this.depth - 1) / 10;
    // return 1;
  }

  shouldStep(dt: number) {
    // test this out
    return dt > 0.2;
  }
  step(dt: number) {
    super.step(dt);
    this.stepEvaporation(dt);
  }
  stepEvaporation(dt: number) {
    const { secondsToEvaporate } = this.world.environment;
    const water = this.inventory.water;
    const evaporationChance = (water / secondsToEvaporate) * clamp(map(this.depth, 1, 8, 1, 0), 0, 1);
    if (Math.random() < evaporationChance * dt) {
      const waterToEvaporate = Math.min(water, 1);
      this.inventory.add(-waterToEvaporate, 0);
      this.world.logEvent({ type: "evaporation", tile: this });
      this.world.numEvaporatedSoil += waterToEvaporate;
    }
  }

  diffuseWater(tile: Tile, dt: number, diffusionRate?: number) {
    if (this.pos.y < tile.pos.y) {
      // test: don't diffuse upwards
      return;
    }
    if (tile instanceof Soil && tile.inventory.water <= tile.saturation) {
      return;
    }
    return super.diffuseWater(tile, dt, diffusionRate);
  }

  stepGravity(dt: number) {
    const freeWater = this.inventory.water - this.saturation;
    if (freeWater > 0) {
      const fallAmount = this.fallAmount * dt;
      const lowerNeighbor = this.world.tileAt(this.pos.x, this.pos.y + 1);
      // if (fallAmount > 0 && this.age % Math.floor(1 / fallAmount) < 1) {
      //   if (hasInventory(lowerNeighbor) && canPullResources(lowerNeighbor, this)) {
      //     this.inventory.give(lowerNeighbor.inventory, 1, 0);
      //   }
      // }
      if (fallAmount > 0 && lowerNeighbor != null && canPullResources(lowerNeighbor, this)) {
        const waterToGive = Math.min(randRound(fallAmount), freeWater);
        this.inventory.give(lowerNeighbor.inventory, waterToGive, 0);
      }
    }
  }
}

export class Sand extends Soil {
  displayName = "Sand";

  get diffusionWater() {
    return 1 / (3 * this.depthDiffusionFactor);
  }

  get saturation() {
    return 0;
  }

  get fallAmount() {
    return 1.5 / this.depthDiffusionFactor;
  }

  public inventory = new Inventory(20, this);
}

export class Silt extends Soil {
  displayName = "Silt";

  get diffusionWater() {
    return 1 / (12 * this.depthDiffusionFactor);
  }

  get saturation() {
    return 2;
  }

  get fallAmount() {
    return 0.2 / this.depthDiffusionFactor;
  }

  public inventory = new Inventory(10, this);
}

export class Clay extends Soil {
  displayName = "Clay";

  get diffusionWater() {
    return 1 / (100 * this.depthDiffusionFactor);
  }

  get saturation() {
    return 5;
  }

  get fallAmount() {
    return 0.05 / this.depthDiffusionFactor;
  }

  public inventory = new Inventory(10, this);
}
