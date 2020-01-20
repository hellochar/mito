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
  public timeRemaining: number;
  constructor(pos: Vector2, world: World, public completedCell: Cell, public start: Tile) {
    super(pos, world, cellTypeGrowingCell);
    this.timeRemaining = completedCell.type.chromosome.mergeStaticProperties().timeToBuild;
  }
  step(dt: number) {
    super.step(dt);
    this.timeRemaining -= this.tempo * dt;
    this.completedCell.pos.copy(this.pos);
    if (this.timeRemaining <= 0) {
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
  chromosome: chromosomeGrowingCell,
  geneSlots: 10,
  name: "Growing Cell",
  material: undefined!,
};
