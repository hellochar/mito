import { Player } from "core";
import { ActionRemoveCancer, ActionThaw } from "core/player/action";
import { Constructor } from "../../typings/constructor";
import { TIME_PER_DAY } from "../constants";
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
  displayName: string;
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

  interact(source: Player): ActionThaw {
    return {
      type: "thaw",
      target: this,
    };
  }

  thaw(_dt: number) {
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
    this.cell.energy -= dt / this.secondsToDie;
    throw new StopStep();
  }

  onAttached() {
    this.cell.energy -= 0.2;
  }

  onFrozenChanged() {
    if (this.percentFrozen > 1) {
      this.cell.die();
    } else if (this.percentFrozen <= 0) {
      this.remove();
    }
  }
}

export class CancerEffect extends CellEffect implements Interactable {
  static displayName = "Cancerous";

  static stacks = false;

  public secondsPerDuplication = 12;

  public timeToDuplicate = this.secondsPerDuplication;

  interact(source: Player): ActionRemoveCancer {
    return {
      type: "remove-cancer",
      target: this,
    };
  }

  removeCancer(dt: number) {
    this.timeToDuplicate += 4 * dt;
    if (this.timeToDuplicate > this.secondsPerDuplication * 1.05) {
      this.remove();
    }
  }

  step(dt: number): void {
    // eat 20% energy per day
    this.cell.energy -= (1 / 300) * dt;
    this.timeToDuplicate -= dt;
    if (this.timeToDuplicate < 0) {
      const world = this.cell.world;
      const neighbors = world.tileNeighbors(this.cell.pos);

      // spread to one neighbor:
      // if that neighbor is a cell without cancer, add cancer to that neighbor
      // if that neighbor is empty, duplicate this cell onto that neighbor
      for (const tile of neighbors.array) {
        if (Cell.is(tile) && !tile.findEffectOfType(CancerEffect)) {
          tile.addEffect(new CancerEffect());
          break;
        } else if (tile.world.player.canBuildAt(tile)) {
          // const cell = new Cell(tile.pos, world, this.cell.type, this.cell.args);

          const newCell = new Cell(tile.pos, tile.world, this.cell.type, this.cell.args);
          // half this cell's energy, and give it to the new cell
          this.cell.energy /= 2;
          newCell.energy = this.cell.energy;
          newCell.droopY = this.cell.droopY;
          tile.world.setTileAt(newCell.pos, newCell);
          break;
        }
      }
      this.timeToDuplicate += this.secondsPerDuplication;
    }
  }
}
