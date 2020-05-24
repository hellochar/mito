import { Species } from "core/species";
import { maxBy } from "lodash";
import { clamp } from "math";
import { object, reference, serializable } from "serializr";
import SimplexNoise from "simplex-noise";
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

  private static genHeightPlanet(tile: HexTile, noise: SimplexNoise) {
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

  private static genHeightContinent(tile: HexTile, noise: SimplexNoise) {
    let height = 12 - tile.magnitude / 2.5;
    const { x, y } = tile.cartesian;
    // const angle = Math.atan2(y, x);
    // height += map(noise.noise2D(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5), -1, 1, 5, -5);
    // let height = 0;
    height += noise.noise3D(x / 24, y / 24, 0) * 6;
    height += noise.noise3D(x / 12, y / 12, 1.453) * 3;
    height += noise.noise3D(x / 6, y / 6, 2.453) * 1.5;
    // height += 1;
    // // info.height += 4 - Math.abs(tile.magnitude * tile.magnitude) * 0.02;
    // height -= Math.abs(y * y) * 0.025;
    if (height < 0 && height >= -1) {
      height = 0;
    }
    // height = Math.round(Math.max(Math.min(height, 6), -1));
    // return height;
    height = Math.round(clamp(height, -1, 12));
    return height;
  }

  private static populateLevelInfo(
    tile: HexTile,
    noise: SimplexNoise,
    heightFn: (tile: HexTile, noise: SimplexNoise) => number
  ) {
    const { info } = tile;
    // info.height = OverWorld.genHeightContinents(tile, noise);
    info.height = heightFn(tile, noise);
  }

  static generateLargeContinent(maxDist: number = 20): OverWorld {
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
        OverWorld.populateLevelInfo(tile, noise, OverWorld.genHeightContinent);
        storage.set(i, j, tile);
      }
    }
    const startTile = OverWorld.getDefaultStartTile(storage);
    return new OverWorld(storage, startTile);
  }

  static generatePlanet(width: number = 50, height: number = 25): OverWorld {
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

        OverWorld.populateLevelInfo(tile, noise, OverWorld.genHeightPlanet);
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
    // const tiles = Array.from(storage);
    const tiles = Array.from(OverWorld.getContinentConnectedHexes(storage)).filter((t) => t.info.height === 0);
    // start at the farthest away tile
    return maxBy(tiles, (t) => t.magnitude)!;
  }

  private static getContinentConnectedHexes(store: HexStore) {
    const filter = (hex: HexTile) => hex.info.height >= 0;
    // start at 0,0, and go outwards from neighbors until you can't anymore
    const frontier = [store.get(0, 0)!];
    const processed = new Set<HexTile>();
    while (frontier.length > 0) {
      const hex = frontier.shift()!;
      processed.add(hex);
      for (const n of store.hexNeighbors(hex)) {
        if (n != null && !frontier.includes(n) && !processed.has(n) && filter(n)) {
          frontier.push(n);
        }
      }
    }
    return processed;
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
    return this.storage.hexNeighbors(hex);
  }

  /**
   * For a given target hex, find the source hexes that
   * can migrate into it.
   */
  public possibleMigrationSources(target: HexTile) {
    const populatedActiveNeighbors = this.hexNeighbors(target).filter((hex) => {
      return hex?.info.flora != null;
    }) as HexTile[];
    if (target.info.flora == null) {
      // if the target is unpopulated, allow any neighbor to migrate into it
      return populatedActiveNeighbors;
    } else {
      // if the target is already populated, disallow "migration" from the same source species
      return populatedActiveNeighbors.filter((s) => s != null && s.info.flora!.species !== target.info.flora!.species);
    }
  }

  public possibleMigrationTargets(source: HexTile) {
    if (source.info.flora == null) {
      console.error("can't migrate from a null flora source");
      return [];
    }
    const unpopulatedNeighbors = this.hexNeighbors(source).filter((hex) => {
      // find neighbors that are either:
      //  unpopulated, or
      //  populated but with a different species
      return hex != null && (hex.info.flora == null || hex.info.flora.species !== source.info.flora!.species);
    }) as HexTile[];
    return unpopulatedNeighbors;
  }

  public getStartHex() {
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

  getMaxGenePool(species: Species) {
    return this.getHexesPopulatedBy(species).reduce(
      (pool, tile) => (pool += tile.info.flora!.mutationPointsPerEpoch),
      0
    );
  }

  getHexesPopulatedBy(species: Species) {
    const hexes: HexTile[] = [];
    for (const tile of this.storage) {
      const { flora } = tile.info;
      if (flora && flora.species.id === species.id) {
        hexes.push(tile);
      }
    }
    return hexes;
  }
}
