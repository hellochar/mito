import { HexTile } from "./hexTile";

export class HexStore {
  tiles: { [k: string]: HexTile; } = {};

  private hash(i: number, j: number) {
    return `${i},${j}`;
  }

  get(i: number, j: number) {
    return this.tiles[this.hash(i, j)];
  }

  set(i: number, j: number, tile: HexTile) {
    this.tiles[this.hash(i, j)] = tile;
  }

  hookUpNeighbors() {
    for (const tile of this) {
      const { i, j } = tile;
      tile.neighbors[0] = this.get(i + 1, j);
      tile.neighbors[1] = this.get(i, j + 1);
      tile.neighbors[2] = this.get(i - 1, j + 1);
      tile.neighbors[3] = this.get(i - 1, j);
      tile.neighbors[4] = this.get(i, j - 1);
      tile.neighbors[5] = this.get(i + 1, j - 1);
    }
  }

  *[Symbol.iterator]() {
    for (const key in this.tiles) {
      yield this.tiles[key];
    }
  }
}
