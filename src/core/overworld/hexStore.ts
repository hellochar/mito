import { map, object, serializable } from "serializr";
import { HexTile } from "./hexTile";

export class HexStore {
  @serializable(map(object(HexTile)))
  tiles: { [k: string]: HexTile } = {};

  private hash(i: number, j: number) {
    return `${i},${j}`;
  }

  get(i: number, j: number): HexTile | undefined {
    return this.tiles[this.hash(i, j)];
  }

  set(i: number, j: number, tile: HexTile) {
    this.tiles[this.hash(i, j)] = tile;
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
    const neighbors: (HexTile | undefined)[] = [];
    neighbors[0] = this.get(i + 1, j);
    neighbors[1] = this.get(i, j + 1);
    neighbors[2] = this.get(i - 1, j + 1);
    neighbors[3] = this.get(i - 1, j);
    neighbors[4] = this.get(i, j - 1);
    neighbors[5] = this.get(i + 1, j - 1);
    return neighbors;
  }

  *[Symbol.iterator]() {
    for (const key in this.tiles) {
      yield this.tiles[key];
    }
  }
}
