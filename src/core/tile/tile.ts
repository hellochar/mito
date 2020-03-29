import shuffle from "math/shuffle";
import { Vector2 } from "three";
import { clamp, randRound } from "../../math/index";
import { Steppable } from "../entity";
import { HasInventory, Inventory } from "../inventory";
import { Temperature, temperatureFor } from "../temperature";
import { World } from "../world/world";
import { canPullResources } from "./canPullResources";

export abstract class Tile implements Steppable, HasInventory {
  displayName = "Tile";

  static fallAmount = 0;

  public abstract get isObstacle(): boolean;

  public darkness = Infinity;

  public temperatureFloat: number;

  public dtSinceLastStepped = 0;

  public abstract inventory: Inventory;

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
  public redistributeInventoryToNeighbors() {
    if (this.inventory.water > 0 || this.inventory.sugar > 0) {
      // push resources to nearby tiles
      const neighbors = this.world.tileNeighbors(this.pos);
      const giveCandidates = Array.from(neighbors.values()).filter((n) => canPullResources(n, this));
      while (!this.inventory.isEmpty() && giveCandidates.length > 0) {
        shuffle(giveCandidates);
        for (let i = 0; i < giveCandidates.length; i++) {
          const neighbor = giveCandidates[i];
          // give 1 to this neighbor
          this.inventory.give(neighbor.inventory, 1, 1);
          // delete this neighbor from candidates to give
          if (neighbor.inventory.isMaxed()) {
            giveCandidates.splice(i, 1);
          }
          if (this.inventory.isEmpty()) {
            // we're all done
            break;
          }
        }
      }
    }
  }

  // test tiles diffusing water around on same-type tiles
  public step(dt: number) {
    const neighbors = this.world.tileNeighbors(this.pos);
    this.stepDarkness(neighbors);
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

  stepDiffusion(neighbors: Map<Vector2, Tile>, dt: number) {
    for (const tile of neighbors.values()) {
      if (!canPullResources(this, tile)) {
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

  diffuseWater(giver: Tile, dt: number, diffusionRate = this.diffusionWater) {
    // Diffusion equation by finite difference: the purpose of this equation is to eventually
    // equalize the amount of water between me and giver. The two questions are how long
    // does it take, and what function does it follow to get there? These are generally
    // defined by the diffusionWater variable. At these low numbers we can assume
    // near linearity.
    const difference = giver.inventory.water - this.inventory.water;
    if (difference > 1) {
      const diffusionAmount = Math.min(difference * diffusionRate * dt, difference / 2);
      giver.inventory.give(this.inventory, randRound(diffusionAmount), 0);
    }
  }

  diffuseSugar(giver: Tile, dt: number) {
    const difference = giver.inventory.sugar - this.inventory.sugar;
    if (difference > 1) {
      const diffusionAmount = Math.min(difference * this.diffusionSugar * dt, difference / 2);
      // sugar diffuses continuously
      giver.inventory.give(this.inventory, 0, randRound(diffusionAmount));
    }
  }

  /**
   * Give to your lower neighbor.
   */
  stepGravity(dt: number) {
    const fallAmount = this.fallAmount * dt;
    const lowerNeighbor = this.world.tileAt(this.pos.x, this.pos.y + 1);
    // if (fallAmount > 0 && this.age % Math.floor(1 / fallAmount) < 1) {
    //   if (hasInventory(lowerNeighbor) && canPullResources(lowerNeighbor, this)) {
    //     this.inventory.give(lowerNeighbor.inventory, 1, 0);
    //   }
    // }
    if (fallAmount > 0 && lowerNeighbor != null && canPullResources(lowerNeighbor, this)) {
      this.inventory.give(lowerNeighbor.inventory, randRound(fallAmount), 0);
    }
  }

  toString() {
    return this.displayName + "(" + this.pos.x + "," + this.pos.y + ")";
  }
}
