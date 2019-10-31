import { Vector2 } from "three";
import { Noise } from "../../../common/perlin";
import { traitMod } from "../../../evolution/traits";
import { clamp, map, randRound } from "../../../math/index";
import { Constructor } from "../constructor";
import { DIRECTIONS } from "../directions";
import { hasInventory, HasInventory, Inventory } from "../inventory";
import { params } from "../params";
import { Steppable, StopStep } from "./entity";
import { Interactable, isInteractable } from "./interactable";
import { nextTemperature, Temperature, temperatureFor } from "./temperature";
import { TIME_PER_SEASON, World } from "./world";

export interface HasEnergy {
  energy: number;
}

export function hasEnergy<T>(e: T): e is HasEnergy & T {
  return typeof (e as any).energy === "number";
}

export abstract class Tile implements Steppable {
  static displayName = "Tile";
  static fallAmount = 0;
  public isObstacle = false;
  public darkness = Infinity;
  public temperatureFloat: number;
  public dtSinceLastStepped = 0;
  get temperature(): Temperature {
    return temperatureFor(this.temperatureFloat);
  }

  get diffusionWater(): number {
    return (this.constructor as any).diffusionWater;
  }

  get diffusionSugar(): number {
    return (this.constructor as any).diffusionSugar;
  }

  get fallAmount(): number {
    return (this.constructor as any).fallAmount;
  }

  public readonly timeMade: number;

  public pos: Vector2;

  public get age() {
    return this.world.time - this.timeMade;
  }

  public constructor(pos: Vector2, public readonly world: World) {
    this.pos = pos.clone();
    if (world == null) {
      throw new Error("null world!");
    }
    this.timeMade = world.time;
    this.temperatureFloat = this.world.getCurrentTemperature();
  }

  abstract shouldStep(dt: number): boolean;

  public lightAmount() {
    return Math.sqrt(Math.min(Math.max(map(1 - this.darkness, 0, 1, 0, 1), 0), 1));
  }

  // test tiles diffusing water around on same-type tiles
  public step(dt: number) {
    // const cellHere = this.world.cellAt(this.pos.x, this.pos.y) != null;
    // if (cellHere) {
    //   console.error("stepping environmental tile even when a cell is on-top:", cellHere);
    // }
    const neighbors = this.world.tileNeighbors(this.pos);
    this.stepDarkness(neighbors, dt);
    this.stepDiffusion(neighbors, dt);
    this.stepTemperature(dt);
    this.stepGravity(dt);
  }

  stepTemperature(_dt: number) {
    this.temperatureFloat = this.world.getCurrentTemperature();
  }

  stepDarkness(neighbors: Map<Vector2, Tile>, _dt: number) {
    if (this instanceof Cell) {
      this.darkness = 0;
    } else {
      let minDarkness = this.darkness;
      for (const [, t] of neighbors) {
        const contrib = Math.max(
          0.2,
          map(this.pos.y, this.world.height / 2, this.world.height, params.soilDarknessBase, 1)
        );
        const darknessFromNeighbor = t instanceof Rock ? Infinity : t.darkness + contrib;
        if (t instanceof Cell) {
          minDarkness = 0;
        } else {
          minDarkness = Math.min(minDarkness, darknessFromNeighbor);
        }
      }
      this.darkness = minDarkness;
    }
  }

  stepDiffusion(neighbors: Map<Vector2, Tile>, dt: number) {
    if (hasInventory(this)) {
      for (const tile of neighbors.values()) {
        if (!this.canDiffuse(tile)) {
          continue;
        }
        // take water from neighbors that have more water than you
        if (this.diffusionWater != null) {
          if (tile.inventory.water > this.inventory.water) {
            this.diffuseWater(tile, dt);
          }
        }
        if (this.diffusionSugar != null) {
          if (tile.inventory.sugar > this.inventory.sugar) {
            this.diffuseSugar(tile, dt);
          }
        }
      }
    }
  }

  canDiffuse(tile: Tile): tile is Tile & HasInventory {
    return canPullResources(this, tile);
  }

  diffuseWater(giver: HasInventory, dt: number) {
    if (hasInventory(this)) {
      const diffusionAmount = (giver.inventory.water - this.inventory.water) * this.diffusionWater * dt;
      // if (params.soilDiffusionType === "continuous") {
      //   giver.inventory.give(this.inventory, diffusionAmount, 0);
      // } else {
      giver.inventory.give(this.inventory, randRound(diffusionAmount), 0);
      // }
    }
  }

  diffuseSugar(giver: HasInventory, dt: number) {
    if (hasInventory(this)) {
      const diffusionAmount = (giver.inventory.sugar - this.inventory.sugar) * this.diffusionSugar * dt;
      // if (params.soilDiffusionType === "continuous") {
      //   giver.inventory.give(this.inventory, 0, diffusionAmount);
      // } else {
      giver.inventory.give(this.inventory, 0, randRound(diffusionAmount));
      // }
    }
  }

  stepGravity(dt: number) {
    const fallAmount = this.fallAmount * dt;
    const lowerNeighbor = this.world.tileAt(this.pos.x, this.pos.y + 1);
    // if (fallAmount > 0 && this.age % Math.floor(1 / fallAmount) < 1) {
    //   if (hasInventory(lowerNeighbor) && canPullResources(lowerNeighbor, this)) {
    //     this.inventory.give(lowerNeighbor.inventory, 1, 0);
    //   }
    // }
    if (hasInventory(lowerNeighbor) && fallAmount > 0 && canPullResources(lowerNeighbor, this)) {
      this.inventory.give(lowerNeighbor.inventory, randRound(fallAmount), 0);
    }
  }
}

function allowPull(receiver: any, recieverType: Constructor<any>, giver: any, giverType: Constructor<any>) {
  return receiver instanceof recieverType && giver instanceof giverType;
}

function canPullResources(receiver: any, giver: any): giver is HasInventory {
  return (
    hasInventory(receiver) &&
    hasInventory(giver) &&
    // allow ancestors and children to exchange resources with each other (e.g. Soil and Fountain)
    (receiver instanceof giver.constructor ||
      giver instanceof receiver.constructor ||
      // allow all Cells to give to each other
      (receiver instanceof Cell && giver instanceof Cell) ||
      // allow air to give to soil
      allowPull(receiver, Soil, giver, Air))
  );
}

const noiseCo2 = new Noise();
export class Air extends Tile {
  static displayName = "Air";
  static fallAmount = 1;
  static diffusionWater = 0.1;
  public sunlightCached: number = 1;
  public _co2: number;
  public inventory = new Inventory(20, this);
  public constructor(public pos: Vector2, world: World) {
    super(pos, world);
    this.darkness = 0;
    this._co2 = this.computeCo2();
  }

  // Air always steps every 3 tiles, otherwise rainfall and diffusion go much slower
  // than intended
  shouldStep(dt: number) {
    // if (!this.inventory.isEmpty()) {
    return dt > 3;
    // } else {
    //   return super.shouldStep(dt);
    // }
  }

  private computeCo2() {
    const base = map(this.pos.y, this.world.height / 2, 0, this.world.environment.floorCo2, 1.15);
    const scaleX = map(this.pos.y, this.world.height / 2, 0, 4, 9);
    // const offset = noiseCo2.perlin3(94.2321 - this.pos.x / scaleX, 3221 - this.pos.y / 2.5, world.time / 5 + 93.1) * 0.2;
    const time = this.world == null ? 0 : this.world.time;
    const offset =
      noiseCo2.perlin3(
        94.231 + (this.pos.x - this.world.width / 2) / scaleX,
        2312 + this.pos.y / 8,
        time / 1000 + 93.1
      ) * 0.25;
    return Math.max(Math.min(base + offset, 1), Math.min(0.4, this.world.environment.floorCo2 * 0.75));
  }

  public lightAmount() {
    return this.sunlight();
  }

  step(dt: number) {
    // we do NOT call super, to avoid stepping darkness and diffusion.
    this.stepGravity(dt);
    this.stepDiffusionCheap(dt);
    this.stepEvaporation(dt);
    this.stepTemperature(dt);
    this._co2 = this.computeCo2();
  }

  stepDiffusionCheap(dt: number) {
    // only take water from left and right
    const left = this.world.tileAt(this.pos.x - 1, this.pos.y);
    const right = this.world.tileAt(this.pos.x + 1, this.pos.y);
    // randomize order to remove directional bias
    if (Math.random() < 0.5) {
      this.tryDiffuse(left, dt);
      this.tryDiffuse(right, dt);
    } else {
      this.tryDiffuse(right, dt);
      this.tryDiffuse(left, dt);
    }
  }

  tryDiffuse(t: Tile | null, dt: number) {
    if (t != null && this.canDiffuse(t)) {
      if (t.inventory.water > this.inventory.water) {
        this.diffuseWater(t, dt);
      }
    }
  }

  stepEvaporation(dt: number) {
    if (Math.random() < 0.01 * this.inventory.water * dt) {
      this.inventory.add(-1, 0);
    }
  }

  public co2() {
    return this._co2;
  }

  public sunlight() {
    return this.sunlightCached;
  }
}

export class Soil extends Tile implements HasInventory {
  static displayName = "Soil";
  static diffusionWater = params.soilDiffusionWater;
  public inventory = new Inventory(params.soilMaxWater, this);
  // static fallAmount = params.waterGravityPerTurn;
  get fallAmount() {
    return this.world.environment.waterGravityPerTurn;
  }

  constructor(pos: Vector2, water: number = 0, world: World) {
    super(pos, world);
    this.inventory.add(water, 0);
  }

  shouldStep(dt: number) {
    // test this out
    return dt > 10;
  }

  step(dt: number) {
    super.step(dt);
    this.stepEvaporation(dt);
  }

  stepEvaporation(dt: number) {
    const { evaporationRate, evaporationBottom } = this.world.environment;
    const evaporationHeightScalar = map(this.pos.y, this.world.height / 2, this.world.height * evaporationBottom, 1, 0);
    const evaporationAmountScalar = this.inventory.water;
    if (Math.random() < evaporationRate * evaporationHeightScalar * evaporationAmountScalar * dt) {
      this.inventory.add(-1, 0);
    }
  }
}

export class Rock extends Tile {
  isObstacle = true;
  static displayName = "Rock";
  shouldStep(dt: number) { return dt > 10; }
}

export class DeadCell extends Tile {
  static displayName = "Dead Cell";
  shouldStep(dt: number) { return dt > 10; }
}

export class Fountain extends Soil {
  static displayName = "Fountain";
  isObstacle = true;
  private cooldown = 0;
  constructor(pos: Vector2, water: number = 0, world: World, public turnsPerWater: number) {
    super(pos, water, world);
  }
  step(dt: number) {
    super.step(dt);
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
    if (this.inventory.space() > 1 && this.cooldown <= 0) {
      // just constantly give yourself water
      this.inventory.add(1, 0);
      this.cooldown = this.turnsPerWater;
    }
  }
}

interface CellEffectConstructor extends Constructor<CellEffect> {
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
  }

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
  public readonly turnsToDie = 2000;
  public percentFrozen = 0.5;

  get turnsUntilDeath() {
    return this.turnsToDie - this.age;
  }

  interact(dt: number) {
    this.percentFrozen -= 20 / this.turnsToDie * dt;
    this.onFrozenChanged();
  }

  step(dt: number) {
    if (this.cell.temperature === Temperature.Cold) {
      this.percentFrozen += 1 / this.turnsToDie * dt;
    } else if (this.cell.temperature === Temperature.Freezing) {
      this.percentFrozen += 10 / this.turnsToDie * dt;
    } else {
      this.percentFrozen -= 10 / this.turnsToDie * dt;
    }
    this.onFrozenChanged();

    throw new StopStep();
  }

  onFrozenChanged() {
    if (this.percentFrozen > 1) {
      this.cell.die();
    } else if (this.percentFrozen < 0) {
      this.remove();
    }

  }
}

export class Cell extends Tile implements HasEnergy, Interactable {
  static displayName = "Cell";
  static diffusionWater = params.cellDiffusionWater;
  static diffusionSugar = params.cellDiffusionSugar;
  static turnsToBuild = params.cellGestationTurns;
  public energy: number = params.cellEnergyMax;
  public darkness = 0;
  public nextTemperature: number;
  // offset [-0.5, 0.5] means you're still "inside" this cell, going out of it will break you
  // public offset = new Vector2();
  public droopY = 0;
  public args: any[] = [];
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
    for (const e of this.effects) {
      if (isInteractable(e)) {
        e.interact(dt);
      }
    }
  }

  die() {
    this.world.setTileAt(this.pos, new DeadCell(this.pos, this.world));
  }

  isHungry() {
    // eat below 95% energy
    return this.energy < params.cellEnergyMax * 0.95;
  }

  // Step cells every 3 frames
  shouldStep(dt: number) {
    return dt > 3;
  }

  step(dt: number) {
    const { tempo } = this;
    super.step(dt);
    this.energy -= 1 * tempo * dt;
    for (const effect of this.effects) {
      effect.step(dt);
    }
    const tileNeighbors = this.world.tileNeighbors(this.pos);
    const neighbors = Array.from(tileNeighbors.values());

    // eat from self
    if (this.isHungry()) {
      this.stepEatSugar(this);
    }
    // eat from neighbor's sugars
    if (this.isHungry()) {
      // const neighborsAndSelf = [this, ...neighbors];
      for (const tile of neighbors) {
        this.stepEatSugar(tile);
        if (!this.isHungry()) {
          break;
        }
      }
    }
    // still hungry; take neighbor's energy
    if (this.isHungry()) {
      const energeticNeighbors = (neighbors.filter((t) => hasEnergy(t)) as any) as HasEnergy[];
      this.stepEqualizeEnergy(energeticNeighbors, tempo, dt);
    }

    // this.stepStress(tileNeighbors);
    this.stepDroop(tileNeighbors, dt);
    // TODO scale droop by dt
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

  stepEatSugar(tile: Tile) {
    if (hasInventory(tile) && !(tile instanceof Fruit)) {
      const hunger = params.cellEnergyMax - this.energy;
      // if this number goes up, we become less energy efficient
      // if this number goes down, we are more energy efficient
      const energyToSugarConversion = traitMod(this.world.traits.energyEfficiency, 1 / params.cellEnergyMax, 1 / 1.5);
      const sugarToEat = Math.min(hunger * energyToSugarConversion, tile.inventory.sugar);
      // eat if we're hungry
      if (hunger > 100 && sugarToEat > 0) {
        tile.inventory.add(0, -sugarToEat);
        const gotEnergy = sugarToEat / energyToSugarConversion;
        this.energy += gotEnergy;
        return true;
      }
    }
    return false;
  }

  /**
   * Take energy from neighbors who have more than you
   */
  stepEqualizeEnergy(neighbors: HasEnergy[], tempo: number, dt: number) {
    for (const neighbor of neighbors) {
      if (this.isHungry()) {
        const difference = neighbor.energy - this.energy;
        if (difference > 20) {
          // safe method but lower upper bound on equalization rate
          // energyTransfer = Math.floor((neighbor.energy - this.energy) / energeticNeighbors.length);

          // this may be unstable w/o double buffering
          const rate = 0.125 * tempo * dt;
          const energyTransfer = Math.floor(difference * clamp(rate, 0, 0.5));
          // if (rate > 0.5) {
          //   console.warn("energy transfer rate wants to be unstable", rate);
          // }
          this.energy += energyTransfer;
          neighbor.energy -= energyTransfer;
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
      const chanceToFreeze = traitMod(this.world.traits.coldTolerant, (this.temperature === Temperature.Cold ? 0.001 : 0.01), 1 / 1.5) * dt;
      if (Math.random() < chanceToFreeze) {
        this.addEffect(new FreezeEffect());
      }
    } else if (this.temperatureFloat >= 64) {
      const chanceToLoseWater = traitMod(this.world.traits.heatTolerant, (this.temperature === Temperature.Hot ? 0.001 : 0.01), 1 / 1.5) * dt;
      if (Math.random() < chanceToLoseWater && hasInventory(this)) {
        this.inventory.add(Math.max(-1, this.inventory.water), 0);
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
    if (this.energy < params.cellEnergyMax / 2) {
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
}

export class GrowingCell extends Cell {
  public isObstacle = true;
  public timeRemaining: number;
  public timeToBuild: number;
  constructor(pos: Vector2, world: World, public completedCell: Cell) {
    super(pos, world);
    this.timeRemaining = this.timeToBuild = (completedCell.constructor as any).turnsToBuild || 0;
  }
  step(dt: number) {
    super.step(dt);
    this.timeRemaining -= 1 * this.tempo * dt;
    if (this.timeRemaining <= 0) {
      this.world.setTileAt(this.completedCell.pos, this.completedCell);
    }
  }
}

export class Tissue extends Cell implements HasInventory {
  static displayName = "Tissue";
  public inventory: Inventory;
  constructor(pos: Vector2, world: World) {
    super(pos, world);
    this.inventory = new Inventory(
      Math.floor(traitMod(world.traits.carryCapacity, params.tissueInventoryCapacity, 1.5)),
      this
    );
  }
}

interface IHasTilePairs {
  tilePairs: Vector2[];
}

export function hasTilePairs(t: any): t is IHasTilePairs {
  return t.tilePairs instanceof Array;
}

export class Leaf extends Cell {
  static displayName = "Leaf";
  public isObstacle = false;
  public averageEfficiency = 0;
  public averageSpeed = 0;
  public sugarConverted = 0;
  public tilePairs: Vector2[] = []; // implied that the opposite direction is connected
  public totalSugarProduced = 0;

  public step(dt: number) {
    super.step(dt);
    const neighbors = this.world.tileNeighbors(this.pos);
    this.averageEfficiency = 0;
    this.averageSpeed = 0;
    this.sugarConverted = 0;
    let numAir = 0;
    this.tilePairs = [];

    for (const [dir, tile] of neighbors) {
      const oppositeTile = this.world.tileAt(this.pos.x - dir.x, this.pos.y - dir.y);
      if (tile instanceof Air && oppositeTile instanceof Tissue) {
        numAir += 1;
        this.tilePairs.push(dir);
        const air = tile;
        const tissue = oppositeTile;

        // do the reaction slower in dark places
        const speed = air.sunlight();

        // gives much less sugar lower down
        const efficiency = air.co2();

        this.averageEfficiency += efficiency;
        this.averageSpeed += speed;

        const leafReactionRate = traitMod(this.world.traits.photosynthesis, 0.01, 1.5) * this.tempo;

        // in prime conditions:
        //      our rate of conversion is speed * params.leafReactionRate
        //      we get 1 sugar at 1/efficiencyRatio (> 1) water
        // if we have less than 1/efficiencyRatio water
        //      our rate of conversion scales down proportionally
        //      on conversion, we use up all the available water and get the corresponding amount of sugar
        const bestEfficiencyWater = params.leafSugarPerReaction / efficiency;
        const waterToConvert = Math.min(tissue.inventory.water, bestEfficiencyWater);
        const chance = (speed * leafReactionRate * waterToConvert * dt) / bestEfficiencyWater;
        if (Math.random() < chance) {
          const sugarConverted = waterToConvert * efficiency;
          tissue.inventory.add(-waterToConvert, sugarConverted);
          this.sugarConverted += sugarConverted;
          this.totalSugarProduced += sugarConverted;
        }
      }
    }
    if (numAir > 0) {
      this.averageEfficiency /= numAir;
      // this.averageSpeed /= numAir;
    }
  }
}

export class Root extends Cell {
  static displayName = "Root";
  public isObstacle = true;
  public activeNeighbors: Vector2[] = [];
  public inventory = new Inventory(params.tissueInventoryCapacity, this);
  cooldown = 0;
  public totalSucked = 0;

  public step(dt: number) {
    super.step(dt);
    if (this.cooldown <= 0) {
      this.stepWaterTransfer(dt);
      this.cooldown += traitMod(this.world.traits.rootAbsorption, params.rootTurnsPerTransfer, 1 / 1.5);
    }
    this.cooldown -= 1 * this.tempo * dt;
  }

  private stepWaterTransfer(_dt: number) {
    this.activeNeighbors = [];
    const neighbors = this.world.tileNeighbors(this.pos);
    let doneOnce = false;
    for (const [dir, tile] of neighbors) {
      if (
        tile instanceof Soil
      ) {
        this.activeNeighbors.push(dir);
        if (!doneOnce) {
          const { water } = tile.inventory.give(this.inventory, 1, 0);
          this.totalSucked += water;
          if (water > 0) {
            doneOnce = true;
          }
        }
      }
    }
  }
}

export class Fruit extends Cell {
  static displayName = "Fruit";
  public isObstacle = true;
  public inventory = new Inventory(8, this);
  public neededResources: number;
  public committedResources: Inventory;// = new Inventory(Fruit.neededResources, this);
  public timeMatured?: number;
  static turnsToBuild = 0;
  public turnsToMature: number; // = TIME_PER_SEASON / 3 * 2; // takes two months to mature
  get oneTurnCommitMax() {
    return this.neededResources / this.turnsToMature;
  }

  constructor(pos: Vector2, world: World) {
    super(pos, world);
    this.neededResources = Math.ceil(traitMod(world.traits.fruitNeededResources, 100, 1 / 1.5) / 2) * 2;
    this.committedResources = new Inventory(this.neededResources, this);
    this.committedResources.on("get", this.handleGetResources);
    this.turnsToMature = Math.ceil(traitMod(world.traits.fruitGrowthSpeed, TIME_PER_SEASON / 3 * 2, 1 / 1.5));
  }

  handleGetResources = () => {
    if (this.timeMatured == null && this.isMature()) {
      this.timeMatured = this.world.time;
      this.committedResources.off("get", this.handleGetResources);
    }
  };

  // aggressively take the inventory from neighbors
  step(dt: number) {
    super.step(dt);
    // how fast Fruit takes resources from surrounding tiles and puts it onto itself
    // to be committed
    const maxResourceIntake = 1 * dt * this.tempo;
    const neighbors = this.world.tileNeighbors(this.pos);
    for (const [, neighbor] of neighbors) {
      if (hasInventory(neighbor) && neighbor instanceof Cell && !(neighbor instanceof Fruit)) {
        const wantedWater = Math.min(this.neededResources / 2 - this.committedResources.water, maxResourceIntake);
        const wantedSugar = Math.min(this.neededResources / 2 - this.committedResources.sugar, maxResourceIntake);

        neighbor.inventory.give(this.inventory, wantedWater, wantedSugar);
      }
    }
    this.commitResources(dt);
  }

  commitResources(dt: number) {
    const wantedWater = Math.min(this.neededResources / 2 - this.committedResources.water, this.oneTurnCommitMax / 2 * dt * this.tempo);
    const wantedSugar = Math.min(this.neededResources / 2 - this.committedResources.sugar, this.oneTurnCommitMax / 2 * dt * this.tempo);
    this.inventory.give(this.committedResources, wantedWater, wantedSugar);
  }

  getPercentMatured() {
    const r = this.committedResources;
    return (r.sugar + r.water) / r.capacity;
  }

  isMature() {
    // add 1 buffer for fp errors
    return this.committedResources.water + this.committedResources.sugar >= this.neededResources - 1;
  }
}

function isFractional(x: number) {
  return x % 1 !== 0;
}

export class Transport extends Tissue {
  static displayName = "Transport";
  public cooldownWater = 0;
  public cooldownSugar = 0;

  constructor(pos: Vector2, world: World, public dir: Vector2) {
    super(pos, world);
    if (isFractional(dir.x) || isFractional(dir.y)) {
      throw new Error("build transport with fractional dir " + dir.x + ", " + dir.y);
    }
  }

  step(dt: number) {
    super.step(dt);
    // transport hungers at double speed
    this.energy -= 1 * this.tempo * dt;
    let waterToTransport = 0;
    let sugarToTransport = 0;
    if (this.cooldownWater <= 0) {
      waterToTransport++;
      const turnsPerWater = Math.floor(traitMod(this.world.traits.activeTransportWater, 20, 1 / 1.5));
      this.cooldownWater += turnsPerWater;
    }
    if (this.cooldownSugar <= 0) {
      sugarToTransport++;
      const turnsPerSugar = Math.floor(traitMod(this.world.traits.activeTransportSugar, 20, 1 / 1.5));
      this.cooldownSugar += turnsPerSugar;
    }

    if (waterToTransport > 0 || sugarToTransport > 0) {
      const targetTile = this.getTarget();
      if (targetTile) {
        this.inventory.give(targetTile.inventory, waterToTransport, sugarToTransport);
      }

      const fromTile = this.getFrom();
      if (fromTile) {
        fromTile.inventory.give(this.inventory, waterToTransport, sugarToTransport);
      }
    }
    this.cooldownWater -= 1 * dt * this.tempo;
    this.cooldownSugar -= 1 * dt * this.tempo;
  }

  public getTarget() {
    const targetTile = this.world.tileAt(this.pos.x + this.dir.x, this.pos.y + this.dir.y);
    if (targetTile instanceof Cell && hasInventory(targetTile)) {
      return targetTile;
    }
  }

  public getFrom() {
    const fromTile = this.world.tileAt(this.pos.x - this.dir.x, this.pos.y - this.dir.y);
    if (fromTile instanceof Cell && hasInventory(fromTile)) {
      return fromTile;
    }
  }
}

export class Vein extends Tissue {
  static displayName = "Vein";
  // static diffusionWater = 0;
  static get diffusionWater() {
    return params.veinDiffusion;
  }
  static get diffusionSugar() {
    return params.veinDiffusion;
  }
  public inventory = new Inventory(8, this);
  // diffusionNeighbors(neighbors: Map<Vector2, Tile>) {
  //     return super.diffusionNeighbors(neighbors).filter((t) => t instanceof Vein);
  // }
}
