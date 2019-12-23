import { randRound } from "math";
import { arrayRange } from "math/arrays";
import * as THREE from "three";
import { Vector2 } from "three";
import { GameResult } from "..";
import devlog from "../../../common/devlog";
import { Species } from "../../../evolution/species";
import { getTraits, traitMod, Traits } from "../../../evolution/traits";
import shuffle from "../../../math/shuffle";
import { DIRECTION_VALUES } from "../directions";
import { hasInventory } from "../inventory";
import { params } from "../params";
import {
  CELL_BUILD_TIME,
  CELL_DIFFUSION_SUGAR_TIME,
  CELL_DIFFUSION_WATER_TIME,
  PERCENT_DAYLIGHT,
  TIME_PER_DAY,
  TIME_PER_YEAR,
} from "./constants";
import { Entity, isSteppable, step } from "./entity";
import { Environment, FILL_FUNCTIONS } from "./environment";
import { Player } from "./player";
import { Season, seasonFromTime } from "./Season";
import { Air, Cell, DeadCell, Fruit, Rock, Soil, Tile, Tissue } from "./tile";
import { TileEvent, TileEventType } from "./tileEvent";

export type TileEventLog = {
  [K in TileEventType]: TileEvent[];
};

export class StepStats {
  public events: TileEventLog = {
    "cell-eat": [],
    "cell-transfer-energy": [],
    evaporation: [],
  };
  constructor(public deleted: Entity[] = [], public added: Entity[] = []) {}
  logEvent(event: TileEvent) {
    this.events[event.type].push(event);
  }
}

export class World {
  public time: number = 0;
  public frame: number = 0;
  public readonly width = 50;
  public readonly height = 100;
  public readonly player: Player;
  private readonly gridEnvironment: Tile[][];
  private readonly gridCells: Array<Array<Cell | null>>;
  private readonly neighborCache: Array<Array<Map<Vector2, Tile>>>;
  public readonly wipResult: Omit<GameResult, "status" | "mutationPointsPerEpoch">;
  public readonly species: Species;
  public readonly traits: Traits;

  get season(): Season {
    return seasonFromTime(this.time);
  }

  constructor(public environment: Environment, species: Species) {
    this.wipResult = {
      fruits: [],
      world: this,
    };
    this.species = species;
    this.traits = getTraits(this.species.genes);
    Cell.diffusionWater = traitMod(this.traits.diffuseWater, 1 / CELL_DIFFUSION_WATER_TIME, 2);
    Cell.diffusionSugar = traitMod(this.traits.diffuseSugar, 1 / CELL_DIFFUSION_SUGAR_TIME, 2);
    Cell.timeToBuild = traitMod(this.traits.buildTime, CELL_BUILD_TIME, 1 / 2);
    this.player = new Player(new Vector2(this.width / 2, this.height / 2), this);
    this.gridEnvironment = arrayRange(this.width).map((x) =>
      arrayRange(this.height).map((y) => {
        const pos = new Vector2(x, y);

        let tile: Tile | undefined;
        for (const fillFunction of FILL_FUNCTIONS[environment.fill]) {
          const t = fillFunction(pos, this);
          if (t != null) {
            tile = t;
            break;
          }
        }
        if (tile == null) {
          tile = new Air(pos, this);
        }
        return tile;
      })
    );

    // always drop player on the Soil Air interface
    const playerX = this.player.pos.x;
    const firstSoil = this.gridEnvironment[playerX].find((t) => !(t instanceof Air));
    if (firstSoil) {
      this.player.posFloat.y = firstSoil.pos.y;
    }

    const radius = 2.5;
    this.gridCells = arrayRange(this.width).map((x) =>
      arrayRange(this.height).map((y) => {
        const pos = new Vector2(x, y);
        // add a "seed" of tissue around the player
        if (this.player.pos.distanceTo(pos) < radius) {
          // prevent Rocks underneath the seed
          if (this.gridEnvironment instanceof Rock) {
            this.gridEnvironment[x][y] = new Soil(new Vector2(x, y), 0, this);
          }
          return new Tissue(pos, this);
        } else {
          return null;
        }
      })
    );
    this.neighborCache = arrayRange(this.width).map((x) =>
      arrayRange(this.height).map((y) => {
        return this.computeTileNeighbors(x, y);
      })
    );
    this.fillCachedEntities();

    // step all tiles first with 0 timestep to trigger any initial state
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tileEnvironment = this.gridEnvironment[x][y];
        tileEnvironment && tileEnvironment.step(0);

        const tileCell = this.gridCells[x][y];
        tileCell && tileCell.step(0);
      }
    }
  }

  public tileAt(v: Vector2): Tile | null;
  public tileAt(x: number, y: number): Tile | null;
  public tileAt(xOrVec2: number | Vector2, y?: number): Tile | null {
    let x: number;
    if (xOrVec2 instanceof Vector2) {
      x = xOrVec2.x;
      y = xOrVec2.y;
    } else {
      x = xOrVec2;
      y = y!;
    }

    if (!this.isValidPosition(x, y)) {
      return null;
    }
    const cell = this.gridCells[x][y];
    if (cell != null) {
      return cell;
    } else {
      return this.gridEnvironment[x][y];
    }
  }

  public cells() {
    const { gridCells, width, height } = this;
    return {
      *[Symbol.iterator]() {
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            const g = gridCells[x][y];
            if (g != null) {
              yield g;
            }
          }
        }
      },
    };
  }

  public cellAt(x: number, y: number): Cell | null {
    if (this.isValidPosition(x, y)) {
      return this.gridCells[x][y];
    } else {
      return null;
    }
  }

  public environmentTileAt(x: number, y: number): Tile | null {
    if (this.isValidPosition(x, y)) {
      return this.gridEnvironment[x][y];
    } else {
      return null;
    }
  }

  // Rules for replacement:
  // if tile is environment, clear out the gridCell and set the gridEnvironment.
  // if tile is cell, set gridCell, leave gridEnvironment alone.
  public setTileAt(position: Vector2, tile: Tile): any {
    const { x, y } = position;
    if (!this.isValidPosition(x, y)) {
      throw new Error(`invalid position ${x}, ${y} `);
    }
    if (tile instanceof Fruit) {
      this.wipResult.fruits.push(tile);
    }
    const oldTile = this.tileAt(x, y)!;
    // if replacing a tile with inventory, try giving resources to neighbors of the same type
    if (hasInventory(oldTile)) {
      // // give resources if available to the new tile
      // if (hasInventory(tile) && canPullResources(tile, oldTile)) {
      //   oldTile.inventory.give(tile.inventory, oldTile.inventory.water, oldTile.inventory.sugar);
      // }
      oldTile.redistributeInventoryToNeighbors();
      if (oldTile.inventory.water !== 0 || oldTile.inventory.sugar !== 0) {
        console.warn("lost", oldTile.inventory, "resources to building");
        oldTile.inventory.add(-oldTile.inventory.water, -oldTile.inventory.sugar);
      }
    }

    const oldCell = this.gridCells[x][y];
    if (oldCell != null) {
      this.stepStats.deleted.push(oldCell);
    }

    if (tile instanceof Cell) {
      // set gridCell only
      this.gridCells[x][y] = tile;
    } else {
      // hackhack - we should call .die() on gridCells[x][y] but we already have with the oldTile code above
      this.gridCells[x][y] = null;

      const oldEnvironmentTile = this.gridEnvironment[x][y];
      if (oldEnvironmentTile != null) {
        this.stepStats.deleted.push(oldEnvironmentTile);
      }
      this.gridEnvironment[x][y] = tile;
    }
    this.stepStats.added.push(tile);
    this.handleTileUpdated(position);
  }
  public maybeRemoveCellAt(position: Vector2): Cell | null {
    const cell = this.cellAt(position.x, position.y);
    if (cell) {
      cell.redistributeInventoryToNeighbors();
      this.gridCells[position.x][position.y] = null;
      this.stepStats.deleted.push(cell);
    }
    this.handleTileUpdated(position);
    return cell;
  }
  public isValidPosition(x: number, y: number) {
    if (x >= this.width || x < 0 || y >= this.height || y < 0) {
      return false;
    } else {
      return true;
    }
  }

  public tileNeighbors(pos: Vector2) {
    return this.neighborCache[pos.x][pos.y];
  }

  private computeTileNeighbors(px: number, py: number) {
    const mapping = new Map<Vector2, Tile>();
    // randomize the neighbor array to reduce aliasing
    const directions = DIRECTION_VALUES_RAND[this.frame % DIRECTION_VALUES_RAND.length];
    directions.forEach((v) => {
      const x = px + v.x;
      const y = py + v.y;
      const tile = this.tileAt(x, y);
      if (tile != null) {
        mapping.set(v, tile);
      }
    });
    return mapping;
  }
  // only use for rendering
  // private cachedRenderableEntities?: Entity[];
  // public renderableEntities() {
  //     if (this.cachedRenderableEntities == null) {
  //         throw new Error("accessed renderable entities before filling");
  //     }
  //     return this.cachedRenderableEntities;
  // }

  private cachedEntities?: Entity[];
  public entities() {
    if (this.cachedEntities == null) {
      throw new Error("accessed entities before filling");
    }
    return this.cachedEntities;
  }

  private handleTileUpdated(pos: Vector2) {
    this.neighborCache[pos.x][pos.y] = this.computeTileNeighbors(pos.x, pos.y);
    for (const dir of DIRECTION_VALUES) {
      const x = pos.x + dir.x;
      const y = pos.y + dir.y;
      if (this.isValidPosition(x, y)) {
        this.neighborCache[x][y] = this.computeTileNeighbors(x, y);
      }
    }
    this.fillCachedEntities();
  }
  private fillCachedEntities() {
    const newEntities: Entity[] = [];
    // we do this super hacky thing for performance where we only run every other entity in
    // a checkerboard pattern.
    //
    // also, entities can interact with other entities, there is no lock-step buffer state,
    // which means you can get weird artifacts like "water suddenly moves 20 squares".
    // to combat this we alternatingly reverse the tile iteration order.
    let x = 0,
      y = 0;
    for (x = 0; x < this.width; x++) {
      for (y = (x + this.frame) % 2; y < this.height; y += 2) {
        // checkerboard
        newEntities.push(this.tileAt(x, y)!);
      }
    }
    for (x = 0; x < this.width; x++) {
      for (y = (x + this.frame + 1) % 2; y < this.height; y += 2) {
        // opposite checkerboard
        newEntities.push(this.tileAt(x, y)!);
      }
    }
    if (this.frame % 4 < 2) {
      newEntities.reverse();
    }
    // add player at the end - this is important since Player is currently the only thing
    // that modifies tiles. You can get into situations where tiles that should be dead
    // are still left-over in the entities cache.
    newEntities.push(this.player);
    this.cachedEntities = newEntities;

    // update renderable entities
    // (() => {
    //     const entities: Entity[] = [this.player];
    //     for (x = 0; x < width; x++) {
    //         for (y = 0; y < height; y++) {
    //             entities.push(this.gridEnvironment[x][y]);
    //             const cellMaybe = this.gridCells[x][y];
    //             if (cellMaybe != null) {
    //                 entities.push(cellMaybe);
    //             }
    //         }
    //     }
    //     this.cachedRenderableEntities = entities;
    // })();
  }
  // iterate through all the actions
  private stepStats: StepStats = new StepStats();
  public step(dt: number): StepStats {
    const entities = this.entities();
    this.stepStats = new StepStats();
    // dear god
    entities.forEach((entity) => {
      if (isSteppable(entity)) {
        step(entity, dt);
      }
    });
    this.updateTemperatures();
    this.computeSunlight();
    this.stepWeather(dt);
    this.frame++;
    this.time += dt;
    this.fillCachedEntities();
    return this.stepStats;
    // this.checkResources();
  }

  logEvent(event: TileEvent) {
    this.stepStats.logEvent(event);
  }

  public getLastStepStats() {
    return this.stepStats;
  }

  numRainWater = 0;
  numEvaporatedAir = 0;
  numEvaporatedSoil = 0;
  public stepWeather(dt: number) {
    // offset first rain event by a few seconds
    const isRaining =
      (this.time + this.environment.climate.timeBetweenRainfall - 6) % this.environment.climate.timeBetweenRainfall <
      this.environment.climate.rainDuration;
    if (isRaining) {
      // add multiple random droplets
      let numWater = this.environment.climate.waterPerSecond * dt;
      while (numWater > 0) {
        const dropletSize = Math.min(numWater, 1);
        const x = THREE.Math.randInt(0, this.width - 1);
        const t = this.tileAt(x, 0);
        if (t instanceof Air) {
          const w = randRound(dropletSize);
          t.inventory.add(w, 0);
          this.numRainWater += w;
        }
        numWater -= 1;
      }
    }
  }

  /**
   * 0 to 2pi, where
   * 0 to pi: daytime (time of day - 0 to PERCENT_DAYLIGHT)
   * pi to 2pi: nighttime (PERCENT_DAYLIGHT to 1)
   */
  get sunAngle() {
    const timeOfDay = (this.time / TIME_PER_DAY) % 1;
    if (timeOfDay < PERCENT_DAYLIGHT) {
      return (timeOfDay / PERCENT_DAYLIGHT) * Math.PI;
    } else {
      return Math.PI * (1 + (timeOfDay - PERCENT_DAYLIGHT) / (1 - PERCENT_DAYLIGHT));
    }
  }

  get dayOrNight() {
    return this.sunAngle % (Math.PI * 2) < Math.PI ? "day" : "night";
  }

  get sunAmount() {
    return (Math.atan(Math.sin(this.sunAngle) * 12) / (Math.PI / 2)) * 0.5 + 0.5;
  }

  getCurrentTemperature() {
    const { season } = this.season;
    return this.environment.temperaturePerSeason[season];
  }

  public computeSunlight() {
    // sunlight is special - we step downards from the top; neighbors don't affect the calculation so
    // we don't have buffering problems

    // TODO allow sunlight to go full 45-to-90 degrees
    const sunAngle = this.sunAngle;
    const directionalBias = Math.sin(sunAngle + Math.PI / 2);
    const sunAmount = this.sunAmount;
    for (let y = 0; y <= this.height * 0.6; y++) {
      for (let x = 0; x < this.width; x++) {
        const t = this.environmentTileAt(x, y);
        if (t instanceof Air) {
          let sunlight = 0;
          if (y === 0) {
            sunlight = 1;
          } else {
            const tileUp = this.tileAt(x, y - 1);
            const tileRight = this.tileAt(x + 1, y - 1);
            const tileLeft = this.tileAt(x - 1, y - 1);
            const upSunlight = tileUp instanceof Air ? tileUp.sunlightCached / sunAmount : tileUp == null ? 1 : 0;
            const rightSunlight =
              tileRight instanceof Air ? tileRight.sunlightCached / sunAmount : tileRight == null ? 1 : 0;
            const leftSunlight =
              tileLeft instanceof Air ? tileLeft.sunlightCached / sunAmount : tileLeft == null ? 1 : 0;
            if (directionalBias > 0) {
              // positive light travels to the right
              sunlight = rightSunlight * directionalBias + upSunlight * (1 - directionalBias);
            } else {
              sunlight = leftSunlight * -directionalBias + upSunlight * (1 - -directionalBias);
            }
            sunlight =
              sunlight * (1 - params.sunlightDiffusion) +
              ((upSunlight + rightSunlight + leftSunlight) / 3) * params.sunlightDiffusion;
          }
          // have at least a bit
          sunlight = params.sunlightReintroduction + sunlight * (1 - params.sunlightReintroduction);

          sunlight *= sunAmount;
          t.sunlightCached = sunlight;
        }
      }
    }
  }

  public updateTemperatures() {
    for (const t of this.cells()) {
      t.temperatureFloat = t.nextTemperature;
    }
  }

  public maybeGetGameResult(): GameResult | null {
    // you lose if you're standing on a dead cell
    if (this.tileAt(this.player.pos.x, this.player.pos.y) instanceof DeadCell) {
      return {
        ...this.wipResult,
        mutationPointsPerEpoch: 0,
        status: "lost",
      };
    }
    if (this.time < TIME_PER_YEAR) {
      return null;
    }
    // at the end of the year, we make a decision:
    // you lose if you haven't made a single mature fruit
    const matureFruit = this.wipResult.fruits.filter((f) => f.isMature());
    if (matureFruit.length === 0) {
      return {
        ...this.wipResult,
        mutationPointsPerEpoch: 0,
        status: "lost",
      };
    }
    // you win if there's a seed with full capacity
    return {
      ...this.wipResult,
      mutationPointsPerEpoch: matureFruit.length * traitMod(this.traits.fruitMutationPoints, 1, 1.5),
      status: "won",
    };
  }

  public checkResources() {
    let totalSugar = 0;
    let totalWater = 0;
    let totalEnergy = 0;
    this.entities().forEach((e) => {
      if (hasInventory(e)) {
        totalSugar += e.inventory.sugar;
        totalWater += e.inventory.water;
      }
      if (e instanceof Cell) {
        totalEnergy += e.energy;
      }
    });
    devlog("sugar", totalSugar, "water", totalWater, "energy", totalEnergy);
  }

  public environmentTiles() {
    const self = this;
    return {
      *[Symbol.iterator]() {
        for (const row of self.gridEnvironment) {
          for (const t of row) {
            yield t;
          }
        }
      },
    };
  }
}

export function formatTime(t: number) {
  return new Date(1000 * t).toISOString().substr(14, 5);
}

const DIRECTION_VALUES_RAND = [
  shuffle(DIRECTION_VALUES.slice()),
  shuffle(DIRECTION_VALUES.slice()),
  shuffle(DIRECTION_VALUES.slice()),
  shuffle(DIRECTION_VALUES.slice()),
  shuffle(DIRECTION_VALUES.slice()),
];
