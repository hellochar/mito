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
    *[Symbol.iterator]() {
        for (const key in this.tiles) {
            yield this.tiles[key];
        }
    }
}
