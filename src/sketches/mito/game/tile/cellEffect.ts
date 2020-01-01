import { Constructor } from "../../constructor";
import { CELL_MAX_ENERGY, TIME_PER_DAY } from "../constants";
import { StopStep } from "../entity";
import { Interactable } from "../interactable";
import { Temperature } from "../temperature";
import { Cell } from "./cell";
export abstract class CellEffect {
  private timeMade!: number;
  public cell!: Cell;
  get age() {
    return this.cell.world.time - this.timeMade;
  }
  attachTo(cell: Cell) {
    this.cell = cell;
    this.timeMade = this.cell.world.time;
    this.onAttached();
  }
  onAttached() {}
  /**
   * Return whether to step the next behavior in the chain
   */
  abstract step(dt: number): void;
  remove() {
    const index = this.cell.effects.indexOf(this);
    this.cell.effects.splice(index, 1);
  }
}
export interface CellEffectConstructor extends Constructor<CellEffect> {
  stacks?: boolean;
}
export class FreezeEffect extends CellEffect implements Interactable {
  static displayName = "Frozen";
  static stacks = false;
  public readonly secondsToDie = TIME_PER_DAY;
  public percentFrozen = 0.25;
  chunkCooldown = 0;
  get timeUntilDeath() {
    return this.secondsToDie - this.age;
  }
  interact(dt: number) {
    if (this.chunkCooldown <= 0) {
      this.chunkCooldown += 0.5;
      this.percentFrozen -= (15 / this.secondsToDie) * 0.5;
      if (this.percentFrozen < 0.02) {
        this.percentFrozen = 0;
      }
      this.cell.world.logEvent({
        type: "thaw",
        where: this.cell,
      });
    }
    // this.percentFrozen -= (20 / this.secondsToDie) * dt;
    this.onFrozenChanged();
    return true;
  }

  step(dt: number) {
    if (this.chunkCooldown > 0) {
      this.chunkCooldown -= dt;
    }
    if (this.cell.temperature === Temperature.Cold) {
      this.percentFrozen += (1 / this.secondsToDie) * dt;
    } else if (this.cell.temperature === Temperature.Freezing) {
      this.percentFrozen += (10 / this.secondsToDie) * dt;
    } else {
      // this.percentFrozen -= (10 / this.secondsToDie) * dt;
    }
    this.onFrozenChanged();
    this.cell.energy -= (dt / this.secondsToDie) * CELL_MAX_ENERGY;
    throw new StopStep();
  }
  onAttached() {
    this.cell.energy -= CELL_MAX_ENERGY * 0.2;
  }
  onFrozenChanged() {
    if (this.percentFrozen > 1) {
      this.cell.die();
    } else if (this.percentFrozen <= 0) {
      this.remove();
    }
  }
}
