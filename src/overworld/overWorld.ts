import SimplexNoise from "simplex-noise";

import { HexTile } from "./hexTile";
import { HexStore } from "./hexStore";
import { Temperate, Desert, Rocky } from "../sketches/mito/game/environment";

export class OverWorld {
    private static populateLevelInfo(tile: HexTile, noise: SimplexNoise) {
        const { x, y } = tile.cartesian;
        const { info } = tile;
        info.height += (noise.noise3D(x / 24, y / 24, 0) - 0.2) * 6;
        info.height += noise.noise3D(x / 24, y / 24, 1.453) * 6;
        info.height += noise.noise3D(x / 6, y / 6, 1.453) * 1.5;
        info.height += 1;
        // info.height += 4 - Math.abs(tile.magnitude * tile.magnitude) * 0.02;
        info.height -= Math.abs(y * y) * 0.025;
        if (info.height < 0 && info.height >= -1) {
            info.height = 0;
        }
        info.height = Math.round(Math.max(Math.min(info.height, 6), -1));

        info.environment =
            info.height < 2 ? Temperate() :
            info.height < 4 ? Rocky() :
            Desert();
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
                if (x < -width / 2  || x > width / 2 ||
                    y < -height / 2 || y > height / 2) {
                    continue;
                }

                OverWorld.populateLevelInfo(tile, noise);
                storage.set(i, j, tile);
            }
        }

        return new OverWorld(storage);
    }

    constructor(private storage: HexStore) {
        // hook up neighbors
        storage.hookUpNeighbors();

        // make an initial tile visible
        const tiles = Array.from(storage);
        const startTile = tiles
            .filter(t => t.info.height === 0)
            .sort((t1, t2) => t1.magnitude - t2.magnitude)[0];
        startTile.info.visible = true;
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
