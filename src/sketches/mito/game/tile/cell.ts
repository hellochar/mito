import { Vector2 } from "three";
import { traitMod } from "../../../../evolution/traits";
import { DIRECTIONS } from "../../directions";
import { params } from "../../params";
import { CELL_BUILD_TIME, CELL_DIFFUSION_SUGAR_TIME, CELL_DIFFUSION_WATER_TIME, CELL_MAX_ENERGY } from "../constants";
import { Interactable, isInteractable } from "../interactable";
import { nextTemperature, Temperature } from "../temperature";
import { World } from "../world";
import { CellEffect, CellEffectConstructor, FreezeEffect } from "./cellEffect";
import { DeadCell } from "./deadCell";
import { Rock } from "./rock";
import { Soil } from "./soil";
import { Tile } from "./tile";
export abstract class Cell extends Tile implements Interactable {
  static displayName = "Cell";
  static diffusionWater = 1 / CELL_DIFFUSION_WATER_TIME;
  static diffusionSugar = 1 / CELL_DIFFUSION_SUGAR_TIME;
  static timeToBuild = CELL_BUILD_TIME;
  public energy = CELL_MAX_ENERGY;
  public darkness = 0;
  public nextTemperature: number;
  // offset [-0.5, 0.5] means you're still "inside" this cell, going out of it will break you
  // public offset = new Vector2();
  public droopY = 0;
  public args?: any[];
  public effects: CellEffect[] = [];
  get tempo() {
    if (this.temperatureFloat <= 0) {
      // 50% slower - 1 / 2;
      return 1 / 2;
    } else if (this.temperatureFloat <= 32) {
      // 33% slower - 2 / (2 / 3) = 3
      return 2 / 3;
    } else if (this.temperatureFloat <= 64) {
      return 1;
    } else if (this.temperatureFloat <= 96) {
      // 50% faster
      return 1.5;
    } else {
      // 100% faster
      return 2;
    }
  }
  get darknessContrib() {
    return 0;
  }
  constructor(pos: Vector2, world: World) {
    super(pos, world);
    this.temperatureFloat = 48;
    this.nextTemperature = this.temperatureFloat;
  }
  addEffect(effect: CellEffect) {
    const stacks = (effect.constructor as CellEffectConstructor).stacks;
    if (!stacks) {
      // exit early if we found another one and we don't stack
      if (this.findEffectOfType(effect.constructor as CellEffectConstructor) != null) {
        return;
      }
    }
    effect.attachTo(this);
    this.effects.push(effect);
  }
  findEffectOfType(type: CellEffectConstructor) {
    return this.effects.find((e) => e.constructor === type);
  }
  interact(dt: number) {
    let anyInteracted = false;
    for (const e of this.effects) {
      if (isInteractable(e)) {
        const interacted = e.interact(dt);
        anyInteracted = anyInteracted || interacted;
      }
    }
    if (this.inventory.water > 0 || this.inventory.sugar > 0) {
      anyInteracted = true;
      this.inventory.give(this.world.player.inventory, 30 * dt, 30 * dt);
    }
    return anyInteracted;
  }
  die() {
    this.world.setTileAt(this.pos, new DeadCell(this.pos, this.world));
  }
  getMaxEnergyToEat(dt: number) {
    const hunger = CELL_MAX_ENERGY - this.energy;
    if (hunger < CELL_MAX_ENERGY * 0.05) {
      return 0;
    }
    const EAT_ENERGY_PER_SECOND = CELL_MAX_ENERGY / 5;
    return Math.min(hunger, EAT_ENERGY_PER_SECOND * dt);
  }
  // Step cells every 3 frames
  shouldStep(dt: number) {
    return dt > 0.1;
  }
  step(dt: number) {
    const { tempo } = this;
    super.step(dt);
    this.energy -= tempo * dt;
    for (const effect of this.effects) {
      effect.step(dt);
    }
    const tileNeighbors = this.world.tileNeighbors(this.pos);
    const neighbors = Array.from(tileNeighbors.values());
    let maxEnergyToEat = this.getMaxEnergyToEat(tempo * dt);
    // eat from self
    if (maxEnergyToEat > 0) {
      maxEnergyToEat -= this.stepEatSugar(this, maxEnergyToEat);
    }
    // eat from neighbor's sugars
    // if (maxEnergyToEat > 0) {
    //   // const neighborsAndSelf = [this, ...neighbors];
    //   for (const tile of neighbors) {
    //     maxEnergyToEat -= this.stepEatSugar(tile, maxEnergyToEat);
    //     if (maxEnergyToEat <= 0) {
    //       break;
    //     }
    //   }
    // }
    // still hungry; take neighbor's energy
    if (maxEnergyToEat > 0) {
      const energeticNeighbors = neighbors.filter((t) => t instanceof Cell) as Cell[];
      this.stepEqualizeEnergy(energeticNeighbors, maxEnergyToEat);
    }
    // this.stepStress(tileNeighbors);
    this.stepDroop(tileNeighbors, dt);
    // TODO scale freefalling by dt
    if (this.droopY > 0.5) {
      if (this.pos.y < this.world.height - 1) {
        // make the player ride the train!
        if (this.world.player.pos.equals(this.pos)) {
          this.world.player.pos.y += 1;
        }
        this.world.maybeRemoveCellAt(this.pos);
        this.pos.y += 1;
        this.droopY -= 1;
        this.world.setTileAt(this.pos, this);
      }
    }
    if (this.energy <= 0) {
      this.die();
    }
  }
  stepEatSugar(tile: Tile, maxEnergyToEat: number): number {
    const hunger = maxEnergyToEat;
    // if this number goes up, we become less energy efficient
    // if this number goes down, we are more energy efficient
    const energyToSugarConversion = traitMod(this.world.traits.energyEfficiency, 1 / CELL_MAX_ENERGY, 1 / 1.5);
    const sugarToEat = Math.min(hunger * energyToSugarConversion, tile.inventory.sugar);
    // eat if we're hungry
    if (sugarToEat > 0) {
      tile.inventory.add(0, -sugarToEat);
      const gotEnergy = sugarToEat / energyToSugarConversion;
      this.energy += gotEnergy;
      if (gotEnergy > 0) {
        this.world.logEvent({ type: "cell-eat", who: this });
      }
      return gotEnergy;
    }
    return 0;
  }
  /**
   * Take energy from neighbors who have more than you
   */
  stepEqualizeEnergy(neighbors: Cell[], maxEnergyToEat: number) {
    for (const neighbor of neighbors) {
      if (neighbor.pos.manhattanDistanceTo(this.pos) > 1) continue;
      if (maxEnergyToEat > 0) {
        const difference = neighbor.energy - this.energy;
        if (difference > 20) {
          // safe method but lower upper bound on equalization rate
          // energyTransfer = Math.floor((neighbor.energy - this.energy) / energeticNeighbors.length);
          // this may be unstable w/o double buffering
          const energyTransfer = Math.min(difference / 2, maxEnergyToEat);
          this.energy += energyTransfer;
          neighbor.energy -= energyTransfer;
          maxEnergyToEat -= energyTransfer;
          if (energyTransfer > 1) {
            this.world.logEvent({ type: "cell-transfer-energy", from: neighbor, to: this, amount: energyTransfer });
          }
        }
      } else {
        break; // we're all full, eat no more
      }
    }
  }
  stepTemperature(dt: number) {
    const neighbors = this.world.tileNeighbors(this.pos);
    this.nextTemperature = nextTemperature(this, neighbors, dt);
    // if we're cold, try to naturally heat ourselves
    if (this.temperatureFloat <= 32) {
      const chanceToFreeze =
        traitMod(this.world.traits.coldTolerant, this.temperature === Temperature.Cold ? 0.03 : 0.3, 1 / 1.5) * dt;
      if (Math.random() < chanceToFreeze) {
        this.addEffect(new FreezeEffect());
      }
    } else if (this.temperatureFloat >= 64) {
      const waterToLose = Math.min(this.inventory.water, 1);
      const chanceEvaporate =
        waterToLose *
        traitMod(this.world.traits.heatTolerant, this.temperature === Temperature.Hot ? 0.003 : 0.3, 1 / 1.5);
      if (Math.random() < chanceEvaporate * dt) {
        this.inventory.add(-waterToLose, 0);
        this.world.logEvent({
          type: "evaporation",
          tile: this,
        });
      }
    }
  }
  stepDroop(tileNeighbors: Map<Vector2, Tile>, dt: number) {
    const below = tileNeighbors.get(DIRECTIONS.s)!;
    const belowLeft = tileNeighbors.get(DIRECTIONS.sw)!;
    const belowRight = tileNeighbors.get(DIRECTIONS.se)!;
    const left = tileNeighbors.get(DIRECTIONS.w)!;
    const right = tileNeighbors.get(DIRECTIONS.e)!;
    const above = tileNeighbors.get(DIRECTIONS.n)!;
    const aboveLeft = tileNeighbors.get(DIRECTIONS.nw)!;
    const aboveRight = tileNeighbors.get(DIRECTIONS.ne)!;
    const droopAmount = traitMod(this.world.traits.structuralStability, params.droop, 1 / 1.5) * dt;
    this.droopY += droopAmount;
    if (this.energy < CELL_MAX_ENERGY / 2) {
      this.droopY += droopAmount;
    }
    let hasSupportBelow = false;
    for (const cell of [below, belowLeft, belowRight]) {
      if (cell instanceof Rock || cell instanceof Soil) {
        this.droopY = Math.min(this.droopY, 0);
        return;
      } else if (cell instanceof Cell) {
        this.droopY = Math.min(this.droopY, cell.droopY);
        hasSupportBelow = true;
        return;
      }
    }
    const springNeighborCells = [aboveLeft, above, aboveRight, left, right, this].filter(
      (n) => n instanceof Cell
    ) as Cell[];
    // special case - if there's no support and nothing below me, just start freefalling
    if (!hasSupportBelow && springNeighborCells.length === 1) {
      this.droopY += 1;
    } else {
      // TODO tighten springs scaled by dt
      this.droopY = springNeighborCells.reduce((sum, n) => sum + n.droopY, 0) / springNeighborCells.length;
    }
  }
  stepDarkness(neighbors: Map<Vector2, Tile>) {
    return 0;
  }
}
