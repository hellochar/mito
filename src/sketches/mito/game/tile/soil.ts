import { Inventory } from "sketches/mito/inventory";
import { map, randRound } from "../../../../math/index";
import { canPullResources } from "../canPullResources";
import { Tile } from "./tile";
export abstract class Soil extends Tile {
  /**
   * Soil will aggressively hold onto water below saturation;
   * after saturation, water is easily moved by forces diffusion or gravity.
   */
  abstract get saturation(): number;

  shouldStep(dt: number) {
    // test this out
    return dt > 0.2;
  }
  step(dt: number) {
    super.step(dt);
    this.stepEvaporation(dt);
  }
  stepEvaporation(dt: number) {
    const { evaporationRate, evaporationBottom } = this.world.environment;
    const evaporationHeightScalar = map(this.pos.y, this.world.height / 2, this.world.height * evaporationBottom, 1, 0);
    const evaporationAmountScalar = this.inventory.water;
    if (Math.random() < evaporationRate * evaporationHeightScalar * evaporationAmountScalar * dt) {
      this.inventory.add(-1, 0);
      this.world.logEvent({ type: "evaporation", tile: this });
      this.world.numEvaporatedSoil += 1;
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
  static displayName = "Sand";

  static diffusionWater = 3;

  get saturation() {
    return 0;
  }

  get fallAmount() {
    return 1.5;
  }

  public inventory = new Inventory(20, this);
}

export class Silt extends Soil {
  static displayName = "Silt";

  static diffusionWater = 12;

  get saturation() {
    return 2;
  }

  get fallAmount() {
    return 0.2;
  }

  public inventory = new Inventory(10, this);
}

export class Clay extends Soil {
  static displayName = "Clay";

  static diffusionWater = 100;

  get saturation() {
    return 5;
  }

  get fallAmount() {
    return 0.1;
  }

  public inventory = new Inventory(10, this);
}
