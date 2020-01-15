import { Vector2 } from "three";
import { Noise } from "../../../../common/perlin";
import { map } from "../../../../math/index";
import { Inventory } from "../../inventory";
import { canPullResources } from "../canPullResources";
import { World } from "../world";
import { Tile } from "./tile";
export class Air extends Tile {
  displayName = "Air";
  static fallAmount = 30;
  static diffusionWater = 1.5;
  public sunlightCached: number = 1;
  public _co2: number;
  public inventory = new Inventory(6, this);
  isObstacle = false;
  public constructor(public pos: Vector2, world: World) {
    super(pos, world);
    this.darkness = 0;
    this._co2 = this.computeCo2();
  }
  // Careful - this affects gravity speed
  shouldStep(dt: number) {
    // if (!this.inventory.isEmpty()) {
    return dt > 0.06667;
    // } else {
    //   return super.shouldStep(dt);
    // }
  }
  private computeCo2() {
    const base = map(this.pos.y, this.world.height / 2, 0, this.world.environment.floorCo2, 1.15);
    const scaleX = Math.max(1, map(this.pos.y, this.world.height / 2, 0, 4, 9));
    // const offset = noiseCo2.perlin3(94.2321 - this.pos.x / scaleX, 3221 - this.pos.y / 2.5, world.time / 5 + 93.1) * 0.2;
    const time = this.world == null ? 0 : this.world.time;
    const offset =
      noiseCo2.perlin3(
        94.231 + (this.pos.x - this.world.width / 2) / scaleX,
        2312 + this.pos.y / 8,
        time / 1000 + 93.1
      ) * 0.25;
    return Math.max(Math.min(base + offset, 1), Math.min(0.4, this.world.environment.floorCo2 * 0.75));
  }
  public lightAmount() {
    return this.sunlight();
  }
  step(dt: number) {
    // we do NOT call super, to avoid stepping darkness and diffusion.
    this.stepGravity(dt);
    const tileBelow = this.world.tileAt(this.pos.x, this.pos.y + 1);
    if (!(tileBelow instanceof Air)) {
      this.stepDiffusionCheap(dt);
    }
    this.stepEvaporation(dt);
    this.stepTemperature(dt);
    this._co2 = this.computeCo2();
  }
  stepDiffusionCheap(dt: number) {
    // only take water from left and right
    const left = this.world.tileAt(this.pos.x - 1, this.pos.y);
    const right = this.world.tileAt(this.pos.x + 1, this.pos.y);
    // randomize order to remove directional bias
    if (Math.random() < 0.5) {
      this.tryDiffuse(left, dt);
      this.tryDiffuse(right, dt);
    } else {
      this.tryDiffuse(right, dt);
      this.tryDiffuse(left, dt);
    }
  }
  tryDiffuse(t: Tile | null, dt: number) {
    if (t != null && canPullResources(this, t)) {
      if (t.inventory.water < this.inventory.water) {
        t.diffuseWater(this, dt);
        // this.diffuseWater(t, dt);
      }
    }
  }
  stepEvaporation(dt: number) {
    if (Math.random() < this.world.environment.airEvaporation * this.inventory.water * dt) {
      this.world.numEvaporatedAir += 1;
      this.inventory.add(-1, 0);
      this.world.logEvent({ type: "evaporation", tile: this });
    }
  }
  public co2() {
    return this._co2;
  }
  public sunlight() {
    return this.sunlightCached;
  }
}
const noiseCo2 = new Noise();
