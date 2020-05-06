import shuffle from "math/shuffle";
import { Vector2 } from "three";
import { clamp, randRound } from "../../math/index";
import { Steppable } from "../entity";
import { Inventory } from "../inventory";
import { Temperature, temperatureFor } from "../temperature";
import { World } from "../world/world";

export abstract class Tile implements Steppable {
  displayName = "Tile";

  static fallAmount = 0;

  public abstract get isObstacle(): boolean;

  public darkness = Infinity;

  public temperatureFloat: number;

  public isStructuralSupport = false;

  public dtSinceLastStepped = 0;

  public abstract inventory: Inventory;

  public closestCellAirDistance: number = 1000;

  // public lightIntersection?: Intersection;
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

  get darknessContrib(): number {
    const contrib = Math.max(
      0.2
      // map(this.pos.y, this.world.height / 2, this.world.height, params.soilDarknessBase, 1)
    );
    return contrib;
  }

  get cellAirDistanceContrib() {
    return 1000;
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
    this.temperatureFloat = this.world.weather.getCurrentTemperature();
  }

  abstract shouldStep(dt: number): boolean;

  /**
   * Can this Tile accept resources from the giver? Use this to define
   * boundaries like "Cells can give to each other but not to Soil".
   *
   * By default, allow ancestor/child relationships to exchange resources
   * with each other (e.g. Soil and Fountain).
   */
  canPullResources(giver: Tile): boolean {
    const hasAncestry = this instanceof giver.constructor || giver instanceof this.constructor;
    return hasAncestry;
  }

  /**
   * 0 = full darkness
   * 1 = full light
   */
  public lightAmount() {
    return Math.sqrt(clamp(1 - this.darkness, 0, 1));
  }

  /**
   * Redistribute this tile's inventory to nearby tiles if possible, usually
   * in preparation for removing this tile.
   */
  public redistributeInventoryToNeighbors(water: number = this.inventory.water, sugar: number = this.inventory.sugar) {
    water = clamp(water, 0, this.inventory.water);
    sugar = clamp(sugar, 0, this.inventory.sugar);
    if (water > 0 || sugar > 0) {
      // push resources to nearby tiles
      const neighbors = this.world.tileNeighbors(this.pos);
      const giveCandidates = Array.from(neighbors.values()).filter((n) => n.canPullResources(this));
      let guard = 0;
      while ((water > 0 || sugar > 0) && giveCandidates.length > 0 && guard < 20) {
        shuffle(giveCandidates);
        for (let i = 0; i < giveCandidates.length; i++) {
          const neighbor = giveCandidates[i];
          // give (up to 1) to this neighbor
          const { water: waterGiven, sugar: sugarGiven } = this.inventory.give(
            neighbor.inventory,
            clamp(water, 0, 1),
            clamp(sugar, 0, 1)
          );
          water -= waterGiven;
          sugar -= sugarGiven;
          if (neighbor.inventory.isMaxed()) {
            // delete this neighbor from candidates to give
            giveCandidates.splice(i, 1);
          }
          if (water === 0 && sugar === 0) {
            // we're all done
            break;
          }
        }
        guard++;
      }
      if (guard >= 100) {
        console.error("redistributeInventoryToNeighbors passed guard limit");
      }
    }
  }

  // test tiles diffusing water around on same-type tiles
  public step(dt: number) {
    const neighbors = this.world.tileNeighbors(this.pos);
    this.stepDarkness(neighbors);
    this.stepClosestCellDistance(neighbors);
    this.stepDiffusion(neighbors, dt);
    this.stepTemperature(dt);
    this.stepGravity(dt);
  }

  stepTemperature(_dt: number) {
    this.temperatureFloat = this.world.weather.getCurrentTemperature();
  }

  stepDarkness(neighbors: Map<Vector2, Tile>) {
    let minDarkness = this.darkness;
    for (const [, t] of neighbors) {
      const darknessFromNeighbor = t.darkness + t.darknessContrib;
      minDarkness = Math.min(minDarkness, darknessFromNeighbor);
    }
    this.darkness = minDarkness;
  }

  stepClosestCellDistance(neighbors: Map<Vector2, Tile>) {
    let minDistance = this.closestCellAirDistance + 1;
    for (const [v, t] of neighbors) {
      const neighborDistance = t.closestCellAirDistance + this.cellAirDistanceContrib * v.length();
      minDistance = Math.min(minDistance, neighborDistance);
    }
    this.closestCellAirDistance = this.closestCellAirDistance * 0.5 + minDistance * 0.5;
  }

  stepDiffusion(neighbors: Map<Vector2, Tile>, dt: number) {
    for (const tile of neighbors.values()) {
      if (!this.canPullResources(tile)) {
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

  /**
   * This cell gets water. Take water from the giver.
   */
  diffuseWater(giver: Tile, dt: number, diffusionRate = this.diffusionWater) {
    // Diffusion equation by finite difference: the purpose of this equation is to eventually
    // equalize the amount of water between me and giver. The two questions are how long
    // does it take, and what function does it follow to get there? These are generally
    // defined by the diffusionWater variable.
    const difference = giver.inventory.water - this.inventory.water;

    // Make it harder for water to break into a dry tile. Emulates surface tension at the
    // wet/dry border.
    const isBreakingSurfaceTension = this.inventory.water > 0 || giver.inventory.water > 1;

    if (difference > 0.01 && isBreakingSurfaceTension) {
      // At high dt's this isn't accurate, but at these low numbers we can assume near linearity.
      const diffusionAmount = Math.min(difference * diffusionRate * dt, difference / 2);
      giver.inventory.give(this.inventory, diffusionAmount, 0);
    }
  }

  diffuseSugar(giver: Tile, dt: number, diffusionRate = this.diffusionSugar) {
    const difference = giver.inventory.sugar - this.inventory.sugar;
    // if (difference > 0.1) {
    const diffusionAmount = Math.min(difference * diffusionRate * dt, difference / 2);
    if (randRound(diffusionAmount) > 0) {
      giver.inventory.give(this.inventory, 0, difference / 2);
    }
    // }
  }

  /**
   * Give to your lower neighbor.
   */
  stepGravity(dt: number) {
    const fallAmount = this.fallAmount * dt;
    const lowerNeighbor = this.world.tileAt(this.pos.x, this.pos.y + 1);
    if (fallAmount > 0 && lowerNeighbor != null && lowerNeighbor.canPullResources(this)) {
      this.inventory.give(lowerNeighbor.inventory, randRound(fallAmount), 0);
    }
  }

  toString() {
    return this.displayName + "(" + this.pos.x + "," + this.pos.y + ")";
  }
}
