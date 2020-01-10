import { Vector2 } from "three";
import { Inventory } from "../../inventory";
import { World } from "../world";
import { Cell } from "./cell";
import Chromosome from "./chromosome";
import { GeneLiving } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";

const chromosomeGrowingCell = new Chromosome(GeneLiving.level(2), GeneObstacle.level(0));

export class GrowingCell extends Cell {
  static displayName = "Growing Cell";
  public isObstacle = true;
  public timeRemaining: number;
  public timeToBuild: number;
  public inventory = new Inventory(0, this);
  constructor(pos: Vector2, world: World, public completedCell: Cell) {
    super(pos, world, chromosomeGrowingCell);
    this.timeRemaining = this.timeToBuild = (completedCell.constructor as any).timeToBuild || 0;
  }
  step(dt: number) {
    super.step(dt);
    this.timeRemaining -= this.tempo * dt;
    this.completedCell.pos.copy(this.pos);
    if (this.timeRemaining <= 0) {
      this.world.maybeRemoveCellAt(this.pos);
      this.completedCell.energy = this.energy;
      this.world.setTileAt(this.pos, this.completedCell);
    }
  }
}
