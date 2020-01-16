import { Vector2 } from "three";
import { World } from "../world";
import { Cell } from "./cell";
import Chromosome from "./chromosome";
import { GeneLiving } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";
import { CellType } from "./genome";
import { Tile } from "./tile";

const chromosomeGrowingCell = new Chromosome(GeneLiving.level(2), GeneObstacle.level(0));

export class GrowingCell extends Cell {
  static displayName = "Growing Cell";
  public timeRemaining: number;
  public timeToBuild: number;
  constructor(pos: Vector2, world: World, public completedCell: Cell, public start: Tile) {
    super(pos, world, cellTypeGrowingCell);
    // this.timeRemaining = this.timeToBuild = (completedCell.constructor as any).timeToBuild;
    this.timeRemaining = this.timeToBuild = 1;
    this.energy = 0.01;
  }

  step(dt: number) {
    super.step(dt);

    const neighbors = this.world.tileNeighbors(this.pos);
    for (const [, n] of neighbors) {
      if (n instanceof Cell && !(n instanceof GrowingCell)) {
        const energyToTake = Math.min(dt * 0.1, 1 - this.energy);
        this.energy += energyToTake;
        n.energy -= energyToTake;
        this.world.logEvent({
          type: "cell-transfer-energy",
          from: n,
          to: this,
          amount: energyToTake,
        });
      }
    }

    // this.timeRemaining -= this.tempo * dt;
    this.completedCell.pos.copy(this.pos);
    this.timeRemaining = 1 - this.energy;
    // if (this.timeRemaining <= 0) {
    if (this.energy >= 1) {
      this.world.maybeRemoveCellAt(this.pos);
      this.completedCell.energy = this.energy;
      for (const effect of this.effects) {
        this.completedCell.addEffect(effect);
      }
      this.world.setTileAt(this.pos, this.completedCell);
    }
  }
}

const cellTypeGrowingCell: CellType = {
  c: GrowingCell,
  chromosome: chromosomeGrowingCell,
  geneSlots: 10,
  name: "Growing Cell",
};
