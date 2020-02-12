import { randFloat } from "math";
import { buildComplete } from "sketches/mito/audio";
import { Vector2 } from "three";
import { Cell } from "../../../../core/cell/cell";
import Chromosome from "../../../../core/cell/chromosome";
import { CellType } from "../../../../core/cell/genome";
import { World } from "../../../../core/world/world";
import { GeneLiving } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";

const chromosomeGrowingCell = new Chromosome(GeneLiving.level(2), GeneObstacle.level(0));

export class GrowingCell extends Cell {
  public percentMatured = 0;

  public timeToMaturity: number;

  silent?: boolean;

  constructor(pos: Vector2, world: World, public completedCell: Cell, public start: Vector2) {
    super(pos, world, cellTypeGrowingCell);
    this.timeToMaturity = completedCell.type.chromosome.mergeStaticProperties().timeToBuild;
  }

  step(dt: number) {
    super.step(dt);
    this.percentMatured += (this.tempo * dt) / this.timeToMaturity;
    this.completedCell.pos.copy(this.pos);
    if (this.percentMatured >= 1) {
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

const cellTypeGrowingCell: CellType = {
  chromosome: chromosomeGrowingCell,
  geneSlots: 10,
  name: "Growing Cell",
  material: undefined!,
};
