import { Vector2 } from "three";
import { map } from "../../../../math/index";
import { Inventory } from "../../inventory";
import { SOIL_DIFFUSION_WATER_TIME, SOIL_INVENTORY_CAPACITY } from "../constants";
import { World } from "../world";
import { Tile } from "./tile";
export class Soil extends Tile {
  static displayName = "Soil";
  static diffusionWater = 1 / SOIL_DIFFUSION_WATER_TIME;
  public inventory = new Inventory(SOIL_INVENTORY_CAPACITY, this);
  get fallAmount() {
    return this.world.environment.waterGravityPerTurn;
  }
  constructor(pos: Vector2, water: number = 0, world: World) {
    super(pos, world);
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
}
