import { sleep } from "common/promise";
import { Vector2 } from "three";
import { Steppable } from "../entity";
import { Inventory } from "../inventory";
import { Air, Cell } from "../tile";
import { World } from "../world/world";
import { Player } from "./player";
export class PlayerSeed implements Steppable {
  public readonly inventory = new Inventory(0, this);

  public dtSinceLastStepped = 0;

  private poppedOut = false;

  public constructor(public posFloat: Vector2, public world: World, public player: Player) {}

  shouldStep(): boolean {
    return true;
  }

  get pos() {
    return this.posFloat.clone().round();
  }

  step(dt: number): void {
    const pos = this.pos;
    const tileBelow = this.world.tileAt(pos.x, pos.y + 1);
    if (Air.is(tileBelow)) {
      // can keep going
      const velY = Math.min(20 * dt, 1);
      this.posFloat.y += velY;
    } else {
    }
    this.player.posFloat.copy(this.posFloat);
    if (this.poppedOut) {
      this.world.removePlayerSeed();
    }
  }

  popOut() {
    const start = this.pos;
    const c = new Cell(start, this.world, this.world.genome.cellTypes[0]);
    this.world.setTileAt(start, c);
    sleep(500).then(() => {
      this.world.events.once("step", () => {
        Array.from(
          this.world.bfsIterator(
            start,
            30,
            (t) => !t.isObstacle && t.pos.distanceTo(start) < 2.5,
            (t) => t.pos.distanceTo(start)
          )
        ).forEach((tile, i) => {
          if (!(tile instanceof Cell)) {
            const cell = new Cell(tile.pos, this.world, this.world.genome.cellTypes[0]);
            // const growingCell = new GrowingCell(tile.pos, this.world, cell, start);
            this.world.setTileAt(tile.pos, cell);
          }
        });
      });
    });
    this.poppedOut = true;
  }
}
