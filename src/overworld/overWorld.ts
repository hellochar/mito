import { Species } from "evolution/species";
import { object, reference, serializable } from "serializr";
import SimplexNoise from "simplex-noise";
import { Desert, Rocky, Temperate } from "../sketches/mito/game/environment";
import { HexStore } from "./hexStore";
import { HexTile } from "./hexTile";

export class OverWorld {
  @serializable(object(HexStore))
  storage: HexStore;
  @serializable(reference(HexTile))
  startTile: HexTile;

  constructor(storage?: HexStore, startTile?: HexTile) {
    this.storage = storage!;
    this.startTile = startTile!;

    // ensure the start tile is visible
    if (this.startTile) {
      this.startTile.info.visible = true;
    }
  }

  private static randomHeight(tile: HexTile, noise: SimplexNoise) {
    const { x, y } = tile.cartesian;
    let height = 0;
    height += (noise.noise3D(x / 24, y / 24, 0) - 0.2) * 6;
    height += noise.noise3D(x / 24, y / 24, 1.453) * 6;
    height += noise.noise3D(x / 6, y / 6, 1.453) * 1.5;
    height += 1;
    // info.height += 4 - Math.abs(tile.magnitude * tile.magnitude) * 0.02;
    height -= Math.abs(y * y) * 0.025;
    if (height < 0 && height >= -1) {
      height = 0;
    }
    height = Math.round(Math.max(Math.min(height, 6), -1));
    return height;
  }

  private static populateLevelInfo(tile: HexTile, noise: SimplexNoise) {
    const { info } = tile;
    info.height = OverWorld.randomHeight(tile, noise);

    info.environment = info.height < 2 ? Temperate() : info.height < 4 ? Rocky() : Desert();
  }

  static generateFilledHex(maxDist: number = 20): OverWorld {
    const storage = new HexStore();
    const noise = new SimplexNoise();
    // the rule is: i + j + k = 0
    // abs(i) <= maxDist
    // abs(j) <= maxDist
    // abs(k) <= maxDist
    for (let i = -maxDist; i <= maxDist; i++) {
      for (let j = -maxDist; j <= maxDist; j++) {
        let k = -(i + j);
        if (Math.abs(k) > maxDist) {
          continue;
        }
        const tile = new HexTile(i, j);
        OverWorld.populateLevelInfo(tile, noise);
        storage.set(i, j, tile);
      }
    }
    const startTile = OverWorld.getDefaultStartTile(storage);
    return new OverWorld(storage, startTile);
  }

  static generateRectangle(width: number = 50, height: number = 25): OverWorld {
    const storage = new HexStore();
    const noise = new SimplexNoise();
    // the rule is: i + j + k = 0
    // abs(i) <= maxDist
    // abs(j) <= maxDist
    // abs(k) <= maxDist
    const maxDist = Math.max(width / 2, height / 2);

    for (let i = -maxDist; i <= maxDist; i++) {
      for (let j = -maxDist; j <= maxDist; j++) {
        let k = -(i + j);
        if (Math.abs(k) > maxDist) {
          continue;
        }
        const tile = new HexTile(i, j);
        const { x, y } = tile.cartesian;
        if (x < -width / 2 || x > width / 2 || y < -height / 2 || y > height / 2) {
          continue;
        }

        OverWorld.populateLevelInfo(tile, noise);
        storage.set(i, j, tile);
      }
    }

    const startTile = OverWorld.getDefaultStartTile(storage);
    return new OverWorld(storage, startTile);
  }

  static getDefaultStartTile(storage?: HexStore) {
    if (storage == null) {
      return undefined;
    }
    const tiles = Array.from(storage);
    return tiles.filter((t) => t.info.height === 0).sort((t1, t2) => t1.magnitude - t2.magnitude)[0];
  }

  /**
   * store neighbors at angles [30, 90, 150, 210, 270, 330]
   *
   * 30: (1, 0, -1)
   *
   * 90: (0, 1, -1)
   *
   * 150: (-1, 1, 0)
   *
   * 210: (-1, 0, 1)
   *
   * 270: (0, -1, 1)
   *
   * 330: (1, -1, 0)
   */
  public hexNeighbors(hex: HexTile) {
    const { i, j } = hex;
    const neighbors: HexTile[] = [];
    neighbors[0] = this.storage.get(i + 1, j);
    neighbors[1] = this.storage.get(i, j + 1);
    neighbors[2] = this.storage.get(i - 1, j + 1);
    neighbors[3] = this.storage.get(i - 1, j);
    neighbors[4] = this.storage.get(i, j - 1);
    neighbors[5] = this.storage.get(i + 1, j - 1);
    return neighbors;
  }

  /**
   * For a given target hex, find the source hexes that
   * can migrate into it.
   */
  public possibleMigrationSources(target: HexTile) {
    const populatedActiveNeighbors = this.hexNeighbors(target).filter((hex) => {
      return hex.info.flora != null && hex.info.flora.actionPoints > 0;
    });
    if (target.info.flora == null) {
      // if the target is unpopulated, allow any neighbor to migrate into it
      return populatedActiveNeighbors;
    } else {
      // if the target is already populated, disallow "migration" from the same source species
      return populatedActiveNeighbors.filter((s) => s.info.flora!.species !== target.info.flora!.species);
    }
  }

  public possibleMigrationTargets(source: HexTile) {
    if (source.info.flora == null) {
      console.error("can't migrate from a null flora source");
      return [];
    }
    // can't migrate if you're out of points
    if (source.info.flora.actionPoints < 1) {
      return [];
    }
    const unpopulatedNeighbors = this.hexNeighbors(source).filter((hex) => {
      // find neighbors that are either:
      //  unpopulated, or
      //  populated but with a different species
      return hex.info.flora == null || hex.info.flora.species !== source.info.flora!.species;
    });
    return unpopulatedNeighbors;
  }

  public getStartTile() {
    return this.startTile;
  }

  public hexAt(i: number, j: number) {
    return this.storage.get(i, j);
  }

  *[Symbol.iterator]() {
    for (const tile of this.storage) {
      yield tile;
    }
  }

  resetActionPoints() {
    for (const tile of this.storage) {
      if (tile.info.flora) {
        tile.info.flora.actionPoints = 1;
      }
    }
  }

  unusedHexes() {
    const hexes = [];
    for (const tile of this.storage) {
      if (tile.info.flora && tile.info.flora.actionPoints > 0) {
        hexes.push(tile);
      }
    }
    return hexes;
  }

  getMaxGenePool(species: Species) {
    let pool = 0;
    for (const tile of this.storage) {
      const { flora } = tile.info;
      if (flora && flora.species === species) {
        pool += flora.mutationPointsPerEpoch;
      }
    }
    return pool;
  }
}
