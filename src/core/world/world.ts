import { Toaster } from "@blueprintjs/core";
import { TIME_PER_DAY } from "core/constants";
import { Environment } from "core/environment";
import { Insect } from "core/insect";
import { EventEmitter } from "events";
import { randFloat, roundToNearest } from "math";
import { gridRange } from "math/arrays";
import { TileGenerators } from "std/tileGenerators";
import { Vector2 } from "three";
import devlog from "../../common/devlog";
import shuffle from "../../math/shuffle";
import Genome from "../cell/genome";
import { DIRECTION_VALUES } from "../directions";
import { Entity, isSteppable, step } from "../entity";
import { Player } from "../player/player";
import { PlayerSeed } from "../player/playerSeed";
import { Season, seasonFromTime } from "../season";
import { Species } from "../species";
import { Air, Cell, Soil, Tile } from "../tile";
import { TileEvent } from "../tile/tileEvent";
import { createGeneratorContext, GeneratorContext, GeneratorInfo } from "./generatorContext";
import { StepStats } from "./stepStats";
import { Weather } from "./weather";

export interface WorldOptions {
  width: number;
  height: number;
}

const optionsDefault: WorldOptions = {
  width: 50,
  height: 100,
};

export class World {
  get minVector() {
    return new Vector2(0, 0);
  }

  get maxVector() {
    return new Vector2(this.width - 1, this.height - 1);
  }

  isAtEdge(pos: Vector2) {
    return pos.x === 0 || pos.x === this.width - 1 || pos.y === 0 || pos.y === this.height - 1;
  }

  public time: number = 0;

  public frame: number = 0;

  public readonly width: number;

  public readonly height: number;

  public readonly player: Player;

  public insects: Insect[] = [];

  public playerSeed?: PlayerSeed;

  public events = new EventEmitter();

  private readonly gridEnvironment: Tile[][];

  private readonly gridCells: Array<Array<Cell | null>>;

  private readonly neighborCache: Array<Array<NeighborMap>>;

  public readonly mpEarners = new Map<Cell, number>();

  public oxygenContribution: number = 0;

  public readonly species: Species;

  public readonly generatorContext: GeneratorContext;

  public weather: Weather;

  genome: Genome;

  private generatorInfoCache = new Map<string, GeneratorInfo>();

  public get oxygenPerSecond() {
    return roundToNearest(this.oxygenContribution / this.time, 0.01);
  }

  public generatorInfo(pos: Vector2): GeneratorInfo {
    const key = `${pos.x},${pos.y}`;
    if (!this.generatorInfoCache.has(key)) {
      this.generatorInfoCache.set(key, this.computeGeneratorInfo(pos));
    }
    return this.generatorInfoCache.get(key)!;
  }

  private computeGeneratorInfo(pos: Vector2): GeneratorInfo {
    const { noiseHeight, noiseWater, noiseLarge0, noiseMid0 } = this.generatorContext;
    const { x, y } = pos;
    const { height } = this;

    const soilLevel =
      height / 2 -
      // start soil a bit lower; provides higher chance for low co2 start
      2 -
      // period 20, +-8 - main soil line definition.
      // mid-sized rolling hills. At the max this will approach 22.5deg.
      16 * noiseHeight.perlin2(10, x / 20 + 10) -
      // period 5, +- 1. small detail noise
      2 * noiseHeight.perlin2(0, x / 5);

    const soilLevelFlat =
      height / 2 -
      1 -
      // period 100, +- 1.5 - really low frequency cut
      3 * noiseHeight.perlin2(10, x / 100 + 10) -
      // period 20, amplitude 1 - add some tiny dips here and there
      noiseHeight.perlin2(0, x / 20);

    const heightScalar = (y / height) ** 2;
    const waterValue = noiseWater.simplex2(x / 5, y / 5) + 0.15;

    const large0 = noiseLarge0.octaveSimplex2(x / 20, y / 20, 3, 0.5);
    const mid0 = noiseMid0.simplex2(x / 10, y / 10);
    return {
      soilLevel,
      soilLevelFlat,
      heightScalar,
      waterValue,
      large0,
      mid0,
    };
  }

  get season(): Season {
    return seasonFromTime(this.time);
  }

  constructor(
    public environment: Environment,
    seed: number,
    species: Species,
    optionsPartial: Partial<WorldOptions> = {}
  ) {
    const options = { ...optionsDefault, ...optionsPartial };
    this.width = options.width;
    this.height = options.height;
    this.generatorContext = createGeneratorContext(seed);
    this.species = species;
    this.genome = species.genome;
    this.weather = new Weather(this);

    const tileGenerator = typeof environment.fill === "string" ? TileGenerators[environment.fill] : environment.fill;
    this.gridEnvironment = gridRange(this.width, this.height, (x, y) => {
      const pos = new Vector2(x, y);
      return tileGenerator(pos, this) || new Air(pos, this);
    });

    this.gridCells = gridRange(this.width, this.height, () => null);
    this.neighborCache = gridRange(this.width, this.height, (x, y) => this.computeTileNeighbors(x, y));
    this.fillCachedEntities();

    this.computeSoilDepths();

    // always drop player on the Soil Air interface
    const start = new Vector2(Math.floor(this.width / 2), Math.floor(this.height / 2));
    const firstNonAir = this.gridEnvironment[start.x].find((t) => !Air.is(t) && t.pos.y > 25);
    if (firstNonAir != null) {
      // if we hit a rock, go onto the Air right above it
      start.y = firstNonAir.isObstacle ? firstNonAir.pos.y - 1 : firstNonAir.pos.y;
    }

    this.player = new Player(start, this);
    this.playerSeed = new PlayerSeed(start, this, this.player);

    this.fillCachedEntities();
    this.computeDarkness();
    this.updateClosestCellDistance();

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tileEnvironment = this.gridEnvironment[x][y];
        tileEnvironment && tileEnvironment.step(0);

        const tileCell = this.gridCells[x][y];
        tileCell && tileCell.step(0);
      }
    }
    this.weather.step(0);
  }

  public on(event: "step", cb: (action: StepStats) => void): void;

  public on(event: string, cb: (...args: any[]) => void) {
    this.events.on(event, cb);
  }

  public off(event: string, cb: (...args: any[]) => void) {
    this.events.off(event, cb);
  }

  public removePlayerSeed() {
    this.stepStats.deleted.push(this.playerSeed!);
    delete this.playerSeed;
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

  public cellAt(v: Vector2): Cell | null;

  public cellAt(x: number, y: number): Cell | null;

  public cellAt(x: number | Vector2, y?: number): Cell | null {
    if (x instanceof Vector2) {
      y = x.y;
      x = x.x;
    }
    if (this.isValidPosition(x, y!)) {
      return this.gridCells[x][y!];
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
  public setTileAt(position: Vector2, tile: Tile) {
    const { x, y } = position;
    if (!this.isValidPosition(x, y)) {
      throw new Error(`invalid position ${x}, ${y} `);
    }
    if (Cell.is(tile) && tile.isReproductive) {
      this.mpEarners.set(tile, 0);
    }
    const oldTile = this.tileAt(x, y)!;
    // if replacing a tile, try redistributing inventory to neighbors
    oldTile.redistributeInventoryToNeighbors();
    if (oldTile.inventory.water !== 0 || oldTile.inventory.sugar !== 0) {
      console.warn("lost", oldTile.inventory, "resources to building");
      oldTile.inventory.add(-oldTile.inventory.water, -oldTile.inventory.sugar);
    }

    const oldCell = this.gridCells[x][y];
    if (oldCell != null) {
      this.stepStats.deleted.push(oldCell);
    }

    if (Cell.is(tile)) {
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

  public maybeRemoveCellAt(position: Vector2, die = true): Cell | null {
    const cell = this.cellAt(position.x, position.y);
    if (cell) {
      cell.redistributeInventoryToNeighbors();
      this.gridCells[position.x][position.y] = null;
      this.stepStats.deleted.push(cell);
      cell.isDead = die;
    }
    this.handleTileUpdated(position);
    return cell;
  }

  removeInsect(insect: Insect) {
    this.insects.splice(this.insects.indexOf(insect), 1);
    this.stepStats.deleted.push(insect);
    return true;
  }

  public isValidPosition(x: number, y: number) {
    if (x >= this.width || x < 0 || y >= this.height || y < 0) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * Returns a map from direction offsets (DIRECTIONS.n, .nw, .ne, etc.) to Tile neighbors occupying that offset.
   */
  public tileNeighbors(pos: Vector2) {
    return this.neighborCache[pos.x][pos.y];
  }

  private computeTileNeighbors(px: number, py: number) {
    const mapping = new NeighborMap();
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
    // We have no lock-step buffer state, but entities can interact with  entities
    // so you can get weird artifacts like "water suddenly moves 20 squares" based on the
    // iteration order. Thankfully, generally they only interact with direct neighbors.
    // So, we:
    // 1. order entities in a checkerboard pattern
    // 2. alternatingly reverse the entire array iteration order
    let x = 0,
      y = 0;
    for (x = 0; x < this.width; x++) {
      for (y = (x + this.frame) % 2; y < this.height; y += 2) {
        // checkerboard one
        const t = this.tileAt(x, y)!;
        newEntities.push(t);
        if (Cell.is(t)) {
          const tileUnderneath = this.environmentTileAt(x, y)!;
          if (Air.is(tileUnderneath)) {
            newEntities.push(tileUnderneath);
          }
        }
      }
    }
    for (x = 0; x < this.width; x++) {
      for (y = (x + this.frame + 1) % 2; y < this.height; y += 2) {
        // checkerboard two
        const t = this.tileAt(x, y)!;
        newEntities.push(t);
        if (Cell.is(t)) {
          const tileUnderneath = this.environmentTileAt(x, y)!;
          if (Air.is(tileUnderneath)) {
            newEntities.push(tileUnderneath);
          }
        }
      }
    }
    if (this.frame % 4 < 2) {
      newEntities.reverse();
    }
    // add player at the end - this is important since Player is currently the only thing
    // that modifies tiles. You can get into situations where tiles that should be dead
    // are still left-over in the entities cache.
    if (this.playerSeed) {
      newEntities.push(this.playerSeed);
    } else {
      newEntities.push(this.player);
    }
    newEntities.push(...this.insects);
    this.cachedEntities = newEntities;
  }

  private stepStats: StepStats = new StepStats(this.frame);

  private lastStepStats: StepStats = this.stepStats;

  public step(dt: number): StepStats {
    const entities = this.entities();
    // dear god
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (isSteppable(entity)) {
        step(entity, dt);
      }
    }
    this.stepInsects(dt);
    this.weather.step(dt);
    if (this.stepStats.added.length > 0 || this.stepStats.deleted.length > 0) {
      this.computeDarkness();
      this.updateClosestCellDistance();
    }
    this.frame++;
    this.time += dt;
    this.fillCachedEntities();
    this.events.emit("step", this.stepStats);
    this.lastStepStats = this.stepStats;
    this.stepStats = new StepStats(this.frame);
    return this.lastStepStats;
    // this.checkResources();
  }

  stepInsects(dt: number) {
    if (
      this.playerSeed == null &&
      this.insects.length < 1 &&
      Math.random() < (this.environment.insectsPerDay / TIME_PER_DAY) * dt
    ) {
      InsectToaster.clear();
      InsectToaster.show({
        message: "Insect approaching!",
      });
      this.insects.push(new Insect(new Vector2(randFloat(0, this.width), 0), this));
    }
  }

  logEvent(event: TileEvent) {
    this.stepStats.logEvent(event);
  }

  public getLastStepStats() {
    return this.lastStepStats;
  }

  numRainWater = 0;

  numEvaporatedAir = 0;

  numEvaporatedSoil = 0;

  numRechargedWater = 0;

  public computeSoilDepths() {
    const airPositions = Array.from(this.allEnvironmentTiles())
      .filter((t) => Air.is(t))
      .map((t) => t.pos);

    for (const tile of this.bfsIterator(airPositions, this.width * this.height)) {
      if (tile instanceof Soil) {
        let minNeighborDepth = tile.depth;
        for (const [, neighbor] of this.tileNeighbors(tile.pos)) {
          if (Air.is(neighbor)) {
            minNeighborDepth = 0;
          } else if (neighbor instanceof Soil) {
            minNeighborDepth = Math.min(minNeighborDepth, neighbor.depth);
          }
        }
        tile.depth = minNeighborDepth + 1;
      }
    }
  }

  public computeDarkness() {
    for (const tile of this.bfsIterator(this.player.pos, this.width * this.height)) {
      tile.stepDarkness();
    }
  }

  public updateClosestCellDistance() {
    for (const tile of this.allTiles()) {
      tile.closestCellAirDistance = 1000;
    }
    const startCell = this.player.findNearestWalkableCell();
    for (const tile of this.bfsIterator(startCell?.pos ?? this.player.pos, this.width * this.height)) {
      tile.stepClosestCellDistance();
    }
  }

  earnMP(cell: Cell, mpEarned: number) {
    this.mpEarners.set(cell, mpEarned);
  }

  public checkResources() {
    let totalSugar = 0;
    let totalWater = 0;
    let totalEnergy = 0;
    this.entities().forEach((e) => {
      totalSugar += e.inventory.sugar;
      totalWater += e.inventory.water;
      if (Cell.is(e)) {
        totalEnergy += e.energy;
      }
    });
    devlog("sugar", totalSugar, "water", totalWater, "energy", totalEnergy);
  }

  public allCells() {
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

  public allEnvironmentTiles() {
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

  allTiles() {
    const { width, height } = this;
    const self = this;
    return {
      *[Symbol.iterator]() {
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            const g = self.tileAt(x, y);
            if (g != null) {
              yield g;
            }
          }
        }
      },
    };
  }

  /**
   * Breadth first search (floodfill) generator
   */
  public bfsIterator(
    start: Vector2 | Vector2[],
    limit: number,
    filter?: (tile: Tile) => boolean,
    heuristic?: (tile: Tile) => number
  ) {
    const self = this;
    const frontier = (Array.isArray(start) ? start : [start]).map((v) => this.tileAt(v)!);
    const processed = new Set<Tile>();
    return {
      *[Symbol.iterator]() {
        while (frontier.length > 0 && processed.size < limit) {
          const tile = frontier.shift();
          if (tile == null) {
            return;
          }
          processed.add(tile);
          yield tile;
          const neighbors = self.tileNeighbors(tile.pos);
          for (const [offset, n] of neighbors) {
            if (
              offset.manhattanLength() === 1 &&
              (filter == null || filter(n)) &&
              frontier.indexOf(n) === -1 &&
              !processed.has(n)
            ) {
              frontier.push(n);
            }
          }
          if (heuristic) {
            frontier.sort((a, b) => heuristic(a) - heuristic(b));
          }
        }
      },
    };
  }
}

const DIRECTION_VALUES_RAND = [
  shuffle(DIRECTION_VALUES.slice()),
  shuffle(DIRECTION_VALUES.slice()),
  shuffle(DIRECTION_VALUES.slice()),
  shuffle(DIRECTION_VALUES.slice()),
  shuffle(DIRECTION_VALUES.slice()),
];

const InsectToaster = Toaster.create({
  canEscapeKeyClear: false,
  maxToasts: 1,
  position: "bottom",
});

export class NeighborMap extends Map<Vector2, Tile> {
  private _array: Tile[] | undefined;

  get array() {
    if (this._array == null) {
      this._array = Array.from(this.values());
    }
    return this._array as Tile[];
  }
}
