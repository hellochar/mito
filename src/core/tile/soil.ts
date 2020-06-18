import { TIME_PER_DAY } from "core/constants";
import { Interactable } from "core/interactable";
import { Inventory } from "core/inventory";
import { Action } from "core/player/action";
import { Tile } from "core/tile/tile";
import { clamp, lerp, map, randFloat, randRound } from "math/index";
import { Air } from "./air";
export abstract class Soil extends Tile implements Interactable {
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

  isStructuralSupport = true;

  private rechargeWaterCooldown = randFloat(0, TIME_PER_DAY);

  get depthDiffusionFactor() {
    // make water move slower in deeper soil. Every depth 10, slow down gravity and fallAmount by this much
    return 1 + (this.depth - 1) / 10;
    // return 1;
  }

  /**
   * All soils can pull from each other. Also can pull from Air.
   */
  canPullResources(giver: Tile) {
    return giver instanceof Soil || Air.is(giver);
  }

  interact(): Action | undefined {
    return {
      type: "pickup",
      water: 1,
      sugar: 1,
      target: this,
      continuous: true,
    };
  }

  shouldStep(dt: number) {
    // test this out
    return dt > 0.2;
  }

  step(dt: number) {
    super.step(dt);
    this.stepEvaporation(dt);
    this.stepGiveWater(dt);
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

  stepGiveWater(dt: number) {
    this.rechargeWaterCooldown -= dt;
    if (this.rechargeWaterCooldown <= 0) {
      if (this.inventory.water < this.saturation) {
        this.inventory.add(1, 0);
        this.world.numRechargedWater += 1;
      }
      this.rechargeWaterCooldown += TIME_PER_DAY;
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
      if (fallAmount > 0 && lowerNeighbor != null && lowerNeighbor.canPullResources(this)) {
        const waterToGive = Math.min(randRound(fallAmount), freeWater);
        this.inventory.give(lowerNeighbor.inventory, waterToGive, 0);
      }
    }
  }

  stepTemperature(_dt: number) {
    const outsideTemperature = this.world.weather.getCurrentTemperature();
    this.temperatureFloat = lerp(outsideTemperature, 50, clamp(map(this.depth - 1, 0, 8, 0, 1), 0, 1));
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
    return 2.0 / this.depthDiffusionFactor;
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
    return 0.3 / this.depthDiffusionFactor;
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
    return 0.075 / this.depthDiffusionFactor;
  }

  public inventory = new Inventory(10, this);
}
