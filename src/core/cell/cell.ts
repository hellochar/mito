import { Player } from "core";
import { Inventory } from "core/inventory";
import { Action } from "core/player/action";
import { params } from "game/params";
import { Vector2 } from "three";
import { CELL_DROOP } from "../constants";
import { DIRECTIONS } from "../directions";
import { step } from "../entity";
import { Interactable, isInteractable } from "../interactable";
import { nextTemperature, Temperature } from "../temperature";
import { DeadCell } from "../tile/deadCell";
import { Rock } from "../tile/rock";
import { Soil } from "../tile/soil";
import { Tile } from "../tile/tile";
import { World } from "../world/world";
import { CancerEffect, CellEffect, CellEffectConstructor, FreezeEffect } from "./cellEffect";
import { CellProperties } from "./cellProperties";
import Chromosome from "./chromosome";
import { Gene } from "./gene";
import { GeneInstance } from "./geneInstance";
import { CellType, interactionSpeed } from "./genome";

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

  public readonly properties: CellProperties;

  get isObstacle() {
    return this.properties.isObstacle;
  }

  get isReproductive() {
    return this.properties.isReproductive;
  }

  get diffusionWater() {
    return this.properties.diffusionWater;
  }

  get diffusionSugar() {
    return this.properties.diffusionSugar;
  }

  get timeToBuild() {
    return this.dynamicProperties().timeToBuild;
  }

  get tempo() {
    return this.properties.tempo * this.temperatureTempo;
  }

  get darknessContrib() {
    return 0;
  }

  public args: CellArgs = {
    direction: new Vector2(0, -1),
  };

  constructor(pos: Vector2, world: World, public type: CellType, args?: CellArgs) {
    super(pos, world);
    this.chromosome = type.chromosome;
    this.properties = this.chromosome.getProperties();
    const { inventoryCapacity } = this.properties;
    this.inventory = new Inventory(inventoryCapacity, this);
    if (args?.direction) {
      this.args.direction!.copy(args?.direction);
    }
    this.temperatureFloat = 48;
    this.nextTemperature = this.temperatureFloat;

    this.geneInstances = this.chromosome.newGeneInstances(this);
  }

  /**
   * Temperature speed multiplier.
   */
  protected get temperatureTempo() {
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

  private dynamicProperties() {
    return this.chromosome.getDynamicProperties(this);
  }

  /**
   * All cells can pull from each other.
   */
  canPullResources(giver: Tile) {
    return giver instanceof Cell;
  }

  public getMovespeedMultiplier() {
    return this.temperatureTempo;
  }

  addEffect(effect: CellEffect) {
    const stacks = (effect.constructor as CellEffectConstructor).stacks;
    if (!stacks) {
      // exit early if we found another one and we don't stack
      if (this.findEffectOfType(effect.constructor as CellEffectConstructor) != null) {
        return;
      }
    }
    if (this.properties.cantFreeze && effect instanceof FreezeEffect) {
      return;
    }
    effect.attachTo(this);
    this.effects.push(effect);
  }

  findEffectOfType(type: CellEffectConstructor) {
    return this.effects.find((e) => e.constructor === type);
  }

  interact(source: Player) {
    for (const e of this.effects) {
      if (isInteractable(e)) {
        const action = e.interact(source);
        if (action != null) {
          return action;
        }
      }
    }
    // Cell interaction
    const { interaction } = this.type;
    if (interaction != null) {
      const [water, sugar] = (() => {
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
      const action: Action = {
        type: interaction.type === "give" ? "drop" : "pickup",
        water,
        sugar,
        target: this,
        continuous: interactionSpeed(interaction) === "continuous",
      };
      return action;
    }
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
    if (params.debug) {
      this.validateDirection();
    }

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

      // cancer
      if (Math.random() < this.type.getChanceToBecomeCancerous() * dt) {
        this.addEffect(new CancerEffect());
      }

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

  public validateDirection() {
    const isDirectional = this.properties.isDirectional;
    if (isDirectional) {
      const dir = this.args.direction!;
      if (isFractional(dir.x) || isFractional(dir.y)) {
        debugger;
        console.error("build transport with fractional dir " + dir.x + ", " + dir.y);
      }
      if (dir.manhattanLength() < 1 || dir.manhattanLength() > 3) {
        debugger;
        console.error("bad dir length", dir);
      }
    }
  }
}

function isFractional(x: number) {
  return x % 1 !== 0;
}
