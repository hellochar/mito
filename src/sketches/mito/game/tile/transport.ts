import { traitMod } from "evolution/traits";
import { Vector2 } from "three";
import { TRANSPORT_TIME_BETWEEN_TRANSFERS } from "../constants";
import { World } from "../world";
import { Cell } from "./cell";
import { Tissue } from "./tissue";

export class Transport extends Tissue {
  static displayName = "Transport";
  public cooldownWater = 0;
  public cooldownSugar = 0;
  static buildDirection = new Vector2(0, -1);
  public didJustTransport = false;
  public readonly dir: Vector2;

  constructor(pos: Vector2, world: World, dir: Vector2) {
    super(pos, world);
    this.dir = Object.freeze(dir.clone());
    if (isFractional(dir.x) || isFractional(dir.y)) {
      throw new Error("build transport with fractional dir " + dir.x + ", " + dir.y);
    }
    if (dir.lengthManhattan() < 1 || dir.lengthManhattan() > 3) {
      console.error("bad dir length", dir);
    }
  }

  step(dt: number) {
    super.step(dt);
    this.didJustTransport = false;
    // transport hungers at double speed
    this.energy -= this.tempo * dt;
    let waterToTransport = 0;
    let sugarToTransport = 0;
    if (this.cooldownWater <= 0) {
      waterToTransport++;
      const timePerWater = traitMod(this.world.traits.activeTransportWater, TRANSPORT_TIME_BETWEEN_TRANSFERS, 1 / 1.5);
      this.cooldownWater += timePerWater;
    }
    if (this.cooldownSugar <= 0) {
      sugarToTransport++;
      const timePerSugar = traitMod(this.world.traits.activeTransportSugar, TRANSPORT_TIME_BETWEEN_TRANSFERS, 1 / 1.5);
      this.cooldownSugar += timePerSugar;
    }

    if (waterToTransport > 0 || sugarToTransport > 0) {
      const targetTile = this.getTarget();
      let waterMoved = 0;
      let sugarMoved = 0;
      if (targetTile) {
        const { water, sugar } = this.inventory.give(targetTile.inventory, waterToTransport, sugarToTransport);
        waterMoved += water;
        sugarMoved += sugar;
      }

      const fromTile = this.getFrom();
      if (fromTile) {
        const { water, sugar } = fromTile.inventory.give(this.inventory, waterToTransport, sugarToTransport);
        waterMoved += water;
        sugarMoved += sugar;
      }

      if (waterMoved > 0 || sugarMoved > 0) {
        this.didJustTransport = true;
      }
    }
    this.cooldownWater -= dt * this.tempo;
    this.cooldownSugar -= dt * this.tempo;
  }

  public getTarget() {
    const targetTile = this.world.tileAt(this.pos.x + this.dir.x, this.pos.y + this.dir.y);
    if (targetTile instanceof Cell) {
      return targetTile;
    }
  }

  public getFrom() {
    const fromTile = this.world.tileAt(this.pos.x - this.dir.x, this.pos.y - this.dir.y);
    if (fromTile instanceof Cell) {
      return fromTile;
    }
  }
}

function isFractional(x: number) {
  return x % 1 !== 0;
}
