import { Vector2 } from "three";
import { map, randRound } from "../../../../math/index";
import { Inventory } from "../../inventory";
import { canPullResources } from "../canPullResources";
import { SOIL_DIFFUSION_WATER_TIME, SOIL_GRAVITY_PER_SECOND, SOIL_INVENTORY_CAPACITY } from "../constants";
import { World } from "../world";
import { Tile } from "./tile";
export class Soil extends Tile {
  static displayName = "Soil";
  static diffusionWater = 1 / SOIL_DIFFUSION_WATER_TIME;
  /**
   * Soil will aggressively hold onto water below saturation;
   * after saturation, water is easily moved by forces diffusion or gravity.
   */
  public saturation: number;

  public inventory = new Inventory(SOIL_INVENTORY_CAPACITY, this);
  get fallAmount() {
    return SOIL_GRAVITY_PER_SECOND;
  }

  constructor(pos: Vector2, water: number = 0, saturation: number, world: World) {
    super(pos, world);
    this.saturation = saturation;
    this.inventory.add(water, 0);
  }
  shouldStep(dt: number) {
    // test this out
    return dt > 0.3;
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

  stepDiffusion(neighbors: Map<Vector2, Tile>, dt: number) {
    for (const tile of neighbors.values()) {
      // test - don't diffuse upwards ever
      if (tile.pos.y >= this.pos.y) {
        continue;
      }
      if (!canPullResources(this, tile)) {
        continue;
      }
      // take water from neighbors that have more water than you
      if (tile.inventory.water > this.inventory.water) {
        // neighbor is not saturated; don't take
        if (tile instanceof Soil && tile.inventory.water <= tile.saturation) {
          continue;
        }
        this.diffuseWater(tile, dt);
      }
    }
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
