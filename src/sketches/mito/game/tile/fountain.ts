import { Vector2 } from "three";
import { World } from "../world";
import { Soil } from "./soil";
export class Fountain extends Soil {
  static displayName = "Fountain";
  isObstacle = true;
  private cooldown = 0;
  constructor(pos: Vector2, water: number = 0, world: World, public secondsPerWater: number) {
    super(pos, water, world);
  }
  step(dt: number) {
    super.step(dt);
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
    if (this.inventory.space() > 1 && this.cooldown <= 0) {
      // just constantly give yourself water
      this.inventory.add(1, 0);
      this.cooldown = this.secondsPerWater;
    }
  }
}
