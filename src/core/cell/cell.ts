import { Inventory } from "core/inventory";
import { Vector2 } from "three";
import { CELL_DROOP, PLAYER_INTERACT_EXCHANGE_SPEED } from "../constants";
import { DIRECTIONS } from "../directions";
import { Entity, step } from "../entity";
import { Interactable, isInteractable } from "../interactable";
import { nextTemperature, Temperature } from "../temperature";
import { Rock } from "../tile/rock";
import { Soil } from "../tile/soil";
import { Tile } from "../tile/tile";
import { World } from "../world/world";
import { CellEffect, CellEffectConstructor, FreezeEffect } from "./cellEffect";
import Chromosome from "./chromosome";
import { DeadCell } from "./deadCell";
import { Gene, GeneStaticProperties } from "./gene";
import { GeneInstance } from "./geneInstance";
import { CellType } from "./genome";

export interface CellArgs {
  direction?: Vector2;
}

export class Cell extends Tile implements Interactable {
  get displayName() {
    return this.type.name;
  }

  set displayName(n: string) {}

  public energy = 1;

  public darkness = 0;

  public nextTemperature: number;

  // offset [-0.5, 0.5] means you're still "inside" this cell, going out of it will break you
  // public offset = new Vector2();
  public droopY = 0;

  public effects: CellEffect[] = [];

  public chromosome: Chromosome;

  public geneInstances: GeneInstance<Gene<any, string>>[];

  public inventory: Inventory;

  public readonly staticProperties: GeneStaticProperties;

  get isObstacle() {
    return this.staticProperties.isObstacle;
  }

  get isReproductive() {
    return this.staticProperties.isReproductive;
  }

  get diffusionWater() {
    return this.staticProperties.diffusionWater;
  }

  get diffusionSugar() {
    return this.staticProperties.diffusionSugar;
  }

  get timeToBuild() {
    return this.staticProperties.timeToBuild;
  }

  constructor(
    pos: Vector2,
    world: World,
    public type: CellType,
    public args: CellArgs = { direction: new Vector2(1, 0) }
  ) {
    super(pos, world);
    this.chromosome = type.chromosome;
    this.staticProperties = this.chromosome.mergeStaticProperties();
    const { inventoryCapacity, isDirectional } = this.staticProperties;
    this.inventory = new Inventory(inventoryCapacity, this);
    if (isDirectional) {
      const dir = args?.direction?.clone() ?? new Vector2(1, 0);
      if (isFractional(dir.x) || isFractional(dir.y)) {
        throw new Error("build transport with fractional dir " + dir.x + ", " + dir.y);
      }
      if (dir.lengthManhattan() < 1 || dir.lengthManhattan() > 3) {
        console.error("bad dir length", dir);
      }
    }
    this.temperatureFloat = 48;
    this.nextTemperature = this.temperatureFloat;

    this.geneInstances = this.chromosome.newGeneInstances(this);
  }

  protected get tempo() {
    if (this.temperatureFloat <= 0) {
      // 50% slower - 1 / 2;
      return 1 / 2;
    } else if (this.temperatureFloat <= 32) {
      // 33% slower - 2 / (2 / 3) = 3
      return 2 / 3;
    } else if (this.temperatureFloat <= 64) {
      return 1;
    } else if (this.temperatureFloat <= 96) {
      // 25% faster
      return 1.25;
    } else {
      // 50% faster
      return 1.5;
    }
  }

  public getMovespeedMultiplier() {
    return this.tempo;
  }

  get darknessContrib() {
    return 0;
  }

  addEffect(effect: CellEffect) {
    const stacks = (effect.constructor as CellEffectConstructor).stacks;
    if (!stacks) {
      // exit early if we found another one and we don't stack
      if (this.findEffectOfType(effect.constructor as CellEffectConstructor) != null) {
        return;
      }
    }
    if (this.staticProperties.cantFreeze && effect instanceof FreezeEffect) {
      return;
    }
    effect.attachTo(this);
    this.effects.push(effect);
  }

  findEffectOfType(type: CellEffectConstructor) {
    return this.effects.find((e) => e.constructor === type);
  }

  interact(source: Entity, dt: number) {
    dt = this.tempo * dt;
    let anyInteracted = false;
    for (const e of this.effects) {
      if (isInteractable(e)) {
        const interacted = e.interact(source, dt);
        anyInteracted = anyInteracted || interacted;
      }
    }
    // Cell interaction
    const { interaction } = this.type;
    if (interaction != null) {
      const [from, to] =
        interaction.type === "give" ? [source.inventory, this.inventory] : [this.inventory, source.inventory];
      const [waterToGive, sugarToGive] = (() => {
        switch (interaction.resources) {
          case "water":
            return [1, 0];
          case "sugar":
            return [0, 1];
          case "water and sugar":
            return [1, 1];
          case "sugar take water":
            return [-1, 1];
          case "water take sugar":
            return [1, -1];
        }
      })();
      const { water, sugar } = from.give(
        to,
        PLAYER_INTERACT_EXCHANGE_SPEED * waterToGive * dt,
        PLAYER_INTERACT_EXCHANGE_SPEED * sugarToGive * dt
      );

      if (water > 0 || sugar > 0) {
        anyInteracted = true;
      } else if (from.isEmpty()) {
        // if no resources moved because the source had no resources; count
        // that as "successful"
        anyInteracted = true;
      }
    }
    return anyInteracted;
  }

  public isDead = false;

  die() {
    this.world.setTileAt(this.pos, new DeadCell(this.pos, this.world));
  }

  shouldStep(dt: number) {
    return dt > 0.1;
  }

  findGene<G extends Gene>(gene: G): GeneInstance<G> | undefined {
    return this.geneInstances.find((g) => g.isType(gene)) as GeneInstance<G>;
  }

  step(dt: number) {
    // diffusion, darkness, gravity
    super.step(dt);

    const tileNeighbors = this.world.tileNeighbors(this.pos);
    this.stepDroop(tileNeighbors, dt);

    if (this.droopY > 0.5) {
      if (this.pos.y < this.world.height - 1) {
        // make the player ride the train!
        if (this.world.player.pos.equals(this.pos)) {
          this.world.player.posFloat.y += 1;
        }
        this.world.maybeRemoveCellAt(this.pos);
        this.pos.y += 1;
        this.droopY -= 1;
        this.world.setTileAt(this.pos, this);
      } else {
        this.droopY = 0.5;
      }
    }

    if (this.energy <= 0) {
      this.die();
    } else {
      // cell effects and genes scale according to tempo
      dt = this.tempo * dt;

      // step all cell effects (e.g.freezing)
      for (const effect of this.effects) {
        effect.step(dt);
      }

      // step all genes
      this.geneInstances.forEach((g) => step(g, dt));
    }
  }

  stepTemperature(dt: number) {
    const neighbors = this.world.tileNeighbors(this.pos);
    const neighborTemperatures = Array.from(neighbors.values()).map((t) => t.temperatureFloat);
    this.nextTemperature = nextTemperature(this.temperatureFloat, neighborTemperatures, dt);
    // if we're cold, try to naturally heat ourselves
    if (this.temperatureFloat <= 32) {
      const chanceToFreeze = (this.temperature === Temperature.Cold ? 0.03 : 0.3) * dt;
      if (Math.random() < chanceToFreeze) {
        this.addEffect(new FreezeEffect());
      }
    } else if (this.temperatureFloat >= 64) {
      const waterToLose = Math.min(this.inventory.water, 1);
      const chanceEvaporate = waterToLose * (this.temperature === Temperature.Hot ? 0.003 : 0.3);
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
    const droopAmount = CELL_DROOP;
    this.droopY += droopAmount;
    if (this.energy < 0.5) {
      this.droopY += droopAmount;
    }
    for (const cell of [below, belowLeft, belowRight]) {
      if (cell instanceof Rock || cell instanceof Soil) {
        this.droopY = Math.min(this.droopY, 0);
        return;
      } else if (cell instanceof Cell) {
        this.droopY = Math.min(this.droopY, cell.droopY);
        return;
      }
    }
    const springNeighborCells = [aboveLeft, above, aboveRight, left, right, this].filter(
      (n) => n instanceof Cell
    ) as Cell[];
    // TODO tighten springs scaled by dt
    this.droopY = springNeighborCells.reduce((sum, n) => sum + n.droopY, 0) / springNeighborCells.length;
  }

  stepDarkness(neighbors: Map<Vector2, Tile>) {
    return 0;
  }
}

function isFractional(x: number) {
  return x % 1 !== 0;
}
