import { Vector2 } from "three";
import { Constructor } from "../../constructor";
import { CELL_MAX_ENERGY, TIME_PER_DAY } from "../constants";
import { StopStep } from "../entity";
import { Interactable } from "../interactable";
import { Temperature } from "../temperature";
import { Air } from "./air";
import { Cell } from "./cell";
import { DeadCell } from "./deadCell";
import { Fountain } from "./fountain";
import { Fruit } from "./fruit";
import { GrowingCell } from "./growingCell";
import { Leaf } from "./leaf";
import { Rock } from "./rock";
import { Root } from "./root";
import { Soil } from "./soil";
import { Tile } from "./tile";
import { Tissue } from "./tissue";
import { Transport } from "./transport";
import { Vein } from "./vein";

export { Air, DeadCell, Fountain, Rock, Soil, Tile, Cell, Fruit, GrowingCell, Leaf, Root, Tissue, Transport, Vein };

export interface HasEnergy {
  energy: number;
}

export function hasEnergy<T>(e: T): e is HasEnergy & T {
  return typeof (e as any).energy === "number";
}

export interface CellEffectConstructor extends Constructor<CellEffect> {
  stacks?: boolean;
}
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

export class FreezeEffect extends CellEffect implements Interactable {
  static displayName = "Frozen";
  static stacks = false;
  public readonly secondsToDie = TIME_PER_DAY;
  public percentFrozen = 0.25;

  get turnsUntilDeath() {
    return this.secondsToDie - this.age;
  }

  interact(dt: number) {
    this.percentFrozen -= (20 / this.secondsToDie) * dt;
    this.onFrozenChanged();
    return true;
  }

  step(dt: number) {
    if (this.cell.temperature === Temperature.Cold) {
      this.percentFrozen += (1 / this.secondsToDie) * dt;
    } else if (this.cell.temperature === Temperature.Freezing) {
      this.percentFrozen += (10 / this.secondsToDie) * dt;
    } else {
      this.percentFrozen -= (10 / this.secondsToDie) * dt;
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
    } else if (this.percentFrozen < 0) {
      this.remove();
    }
  }
}

interface IHasTilePairs {
  tilePairs: Vector2[];
}

export function hasTilePairs(t: any): t is IHasTilePairs {
  return t.tilePairs instanceof Array;
}
