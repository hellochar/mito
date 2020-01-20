import { Inventory } from "sketches/mito/inventory";
import { Vector2 } from "three";
import { traitMod } from "../../../../evolution/traits";
import { DIRECTIONS } from "../../directions";
import { params } from "../../params";
import { PLAYER_INTERACT_EXCHANGE_SPEED } from "../constants";
import { Entity, step } from "../entity";
import { Interactable, isInteractable } from "../interactable";
import { nextTemperature, Temperature } from "../temperature";
import { World } from "../world";
import { CellEffect, CellEffectConstructor, FreezeEffect } from "./cellEffect";
import Chromosome, { Gene, GeneInstance, GeneStaticProperties } from "./chromosome";
import { DeadCell } from "./deadCell";
import { CellType } from "./genome";
import { Rock } from "./rock";
import { Soil } from "./soil";
import { Tile } from "./tile";

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
  public geneInstances: GeneInstance<Gene<unknown, string>>[];
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

  constructor(pos: Vector2, world: World, public type: CellType, public args?: CellArgs) {
    super(pos, world);
    this.chromosome = type.chromosome;
    this.staticProperties = this.chromosome.mergeStaticProperties();
    const { inventoryCapacity, isDirectional } = this.staticProperties;
    this.inventory = new Inventory(inventoryCapacity, this);
    if (isDirectional) {
      const dir = args!.direction!.clone();
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

  private get tempo() {
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
      }
    }
    return anyInteracted;
  }

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

    // cell effects and genes scale according to tempo
    dt = this.tempo * dt;
    for (const effect of this.effects) {
      effect.step(dt);
    }
    this.geneInstances.forEach((g) => step(g, dt));

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
    if (this.energy < 0.5) {
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

function isFractional(x: number) {
  return x % 1 !== 0;
}
