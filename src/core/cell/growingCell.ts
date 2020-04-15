import { buildComplete } from "game/audio";
import { randFloat } from "math";
import { Vector2 } from "three";
import { GeneLiving } from "../../std/genes";
import { GeneObstacle } from "../../std/genes/GeneObstacle";
import { World } from "../world/world";
import { Cell } from "./cell";
import Chromosome from "./chromosome";
import { CellType } from "./genome";

const chromosomeGrowingCell = new Chromosome(GeneLiving.level(2), GeneObstacle.level(0));

export class GrowingCell extends Cell {
  public percentGrown = 0;

  public timeToGrow: number;

  silent?: boolean;

  constructor(pos: Vector2, world: World, public completedCell: Cell, public start: Vector2) {
    super(pos, world, cellTypeGrowingCell);
    this.timeToGrow = Math.max(completedCell.timeToBuild, 0.00001);
  }

  step(dt: number) {
    super.step(dt);
    this.percentGrown += (this.tempo * dt) / this.timeToGrow;
    this.completedCell.pos.copy(this.pos);
    if (this.percentGrown >= 1) {
      this.world.maybeRemoveCellAt(this.pos);
      this.completedCell.energy = this.energy;
      for (const effect of this.effects) {
        this.completedCell.addEffect(effect);
      }
      this.world.setTileAt(this.pos, this.completedCell);
      if (!this.silent) {
        const id = buildComplete.play();
        buildComplete.rate(id, randFloat(0.5, 1));
      }
    }
  }
}

const cellTypeGrowingCell = new CellType("Growing Cell", 0, chromosomeGrowingCell);
