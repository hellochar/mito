import SimplexNoise from "simplex-noise";

import { HexTile } from "./hexTile";
import { HexStore } from "./hexStore";
import { Temperate, Desert, Rocky } from "../sketches/mito/game/environment";

export class OverWorld {
    private static populateLevelInfo(tile: HexTile, noise: SimplexNoise) {
        const { x, y } = tile.cartesian;
        const { info } = tile;
        info.height += (noise.noise3D(x / 24, y / 24, 0) - 0.25) * 6;
        info.height += noise.noise3D(x / 24, y / 24, 1.453) * 6;
        info.height += noise.noise3D(x / 6, y / 6, 1.453) * 1.5;
        // this.info.height += 4 - Math.abs(this.magnitude * this.magnitude) * 0.02;
        info.height -= Math.abs(y * y) * 0.03;
        if (info.height < 0 && info.height >= -1) {
            info.height = 0;
        }
        info.height = Math.round(Math.max(Math.min(info.height, 6), -1));

        info.environment =
            info.height < 2 ? Temperate() :
            info.height < 4 ? Rocky() :
            Desert();
    }

    static generate(maxDist: number = 33): OverWorld {
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
        // hook up neighbors
        for (const tile of storage) {
            const { i, j } = tile;
            tile.neighbors[0] = storage.get(i + 1, j);
            tile.neighbors[1] = storage.get(i, j + 1);
            tile.neighbors[2] = storage.get(i - 1, j + 1);
            tile.neighbors[3] = storage.get(i - 1, j);
            tile.neighbors[4] = storage.get(i, j - 1);
            tile.neighbors[5] = storage.get(i + 1, j - 1);
        }
        // make an initial tile visible
        const tiles = Array.from(storage);
        const startTile = tiles
            .filter(t => t.info.height === 0)
            .sort((t1, t2) => t1.magnitude - t2.magnitude)[0];
        startTile.info.visible = true;
        return new OverWorld(storage);
    }
    constructor(private storage: HexStore) { }
    public tileAt(i: number, j: number) {
        return this.storage.get(i, j);
    }

    *[Symbol.iterator]() {
        for (const tile of this.storage) {
            yield tile;
        }
    }
}
