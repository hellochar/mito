import SimplexNoise from "simplex-noise";

import { HexTile } from "./hexTile";
import { HexStore } from "./hexStore";
import { Temperate, Desert, Rocky } from "../sketches/mito/game/environment";

export class OverWorld {
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

  private static randomCrusaderHeight(tile: HexTile, noise: SimplexNoise) {
    const { x, y } = tile.cartesian;
    let height = 0;
    // height += (noise.noise3D(x / 24, y / 24, 0) - 0.2) * 6;
    // height += noise.noise3D(x / 24, y / 24, 1.453) * 6;
    // height += noise.noise3D(x / 6, y / 6, 1.453) * 1.5;
    height = noise.noise3D(x / 8, y / 8, 0) * 6;
    height += 1;
    // info.height += 4 - Math.abs(tile.magnitude * tile.magnitude) * 0.02;
    // height -= Math.abs(y * y) * 0.025;
    // if (height < 0 && height >= -1) {
    //   height = 0;
    // }
    // height = Math.round(Math.max(Math.min(height, 6), -1));
    height = Math.round(height);
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
    return new OverWorld(storage);
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

    return new OverWorld(storage);
  }

  private startTile: HexTile;

  constructor(private storage: HexStore) {
    // hook up neighbors
    storage.hookUpNeighbors();

    // make an initial tile visible
    const tiles = Array.from(storage);
    this.startTile = tiles.filter((t) => t.info.height === 0).sort((t1, t2) => t1.magnitude - t2.magnitude)[0];
    this.startTile.info.visible = true;
  }

  public getStartTile() {
    return this.startTile;
  }

  public tileAt(i: number, j: number) {
    return this.storage.get(i, j);
  }

  *[Symbol.iterator]() {
    for (const tile of this.storage) {
      yield tile;
    }
  }
}
