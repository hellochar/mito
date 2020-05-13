import { World } from "core";
import { Fountain, Rock, Tile } from "core/tile";
import { clamp } from "lodash";
import { map, randInt } from "math";
import { Vector2 } from "three";
import { Constructor } from "typings/constructor";
import { DIRECTIONS, Directions } from "./directions";
import { Air } from "./tile/air";
import { Clay, Sand, Silt } from "./tile/soil";

export type TileGenerator = (pos: Vector2, world: World) => Tile | undefined;

export type TileCombiner = (...generators: TileGenerator[]) => TileGenerator;

export type TileScalar = (pos: Vector2, world: World) => number;

/**
 * The later ones take precedence over earlier ones.
 */
export const layers: TileCombiner = (...gens: TileGenerator[]): TileGenerator => {
  const gensReversed = gens.reverse();
  return (pos, world) => {
    for (const generator of gensReversed) {
      const tile = generator(pos, world);
      if (tile) {
        return tile;
      }
    }
  };
};

export function fill(type: Constructor<Tile>): TileGenerator {
  return (pos, world) => new type(pos, world);
}

export function predicate(predicate: (pos: Vector2, world: World) => boolean): TileCombiner {
  return (...generators: TileGenerator[]): TileGenerator => {
    const gens = layers(...generators);
    return (pos, world) => {
      if (predicate(pos, world)) {
        return gens(pos, world);
      }
    };
  };
}

/**
 * Take an existing tile combiner, and reverse it
 */
export function not(original: TileGenerator): TileCombiner {
  return (...generators) => {
    const gen = layers(...generators);

    return (pos, world) => {
      const t = original(pos, world);
      if (t != null) {
        return undefined;
      } else {
        return gen(pos, world);
      }
    };
  };
}

export function modify(cb: (tile: Tile) => void): TileCombiner {
  return (...generators) => {
    const gen = layers(...generators);
    return (pos, world) => {
      const t = gen(pos, world);
      if (t != null) {
        cb(t);
      }
      return t;
    };
  };
}

export const addWater = modify((tile: Tile) => {
  const { heightScalar, waterValue } = tile.world.generatorInfo(tile.pos);
  const water = clamp(
    // create patches of dry and wet
    (waterValue > 0.4 ? heightScalar : 0) *
      // upscale the slope of waterValue - waterValue is a 5x5 simplex
      // 1x1 simplex's max slope is around 0.707 (i think?); for 5x5
      // that slope is reduced to .141. We (* 30) to increase the max slope
      // to 4.24. So at its max, two adjacent Soils will start with
      // ~4 water difference
      30,
    // at least have 1 water
    1,
    // clamp at 10
    10
  );
  tile.inventory.set(water, 0);
});

export const withoutWater = modify((tile) => {
  tile.inventory.set(0, 0);
});

export const addDeepWater = modify((s) => {
  const { world } = s;
  const { y } = s.pos;
  // add a *lot* of water near the bottom quarter of the map
  const water = clamp(map(y, world.height * 0.75, world.height, 1, 9), 1, 10);
  s.inventory.set(water, 0);
});

export const inSoil = predicate((pos, world) => {
  const { soilLevel } = world.generatorInfo(pos);
  const { y } = pos;
  return y > soilLevel;
});

export const inSoilFlat = predicate((pos, world) => {
  const { soilLevelFlat } = world.generatorInfo(pos);
  return pos.y > soilLevelFlat;
});

export function inRockLevel(midLevel = -0.8, bottomLevel = 0.3, wavelength = 5) {
  return predicate((pos, world) => {
    const { x, y } = pos;
    const { generatorContext, height } = world;
    const rockLevel = generatorContext.noiseRock.simplex2(x / wavelength, y / wavelength);
    const rockBias = map(y - height / 2, 0, height / 2, midLevel, bottomLevel);
    return rockBias - rockLevel > 0;
  });
}

export function pastSoilDepth(level: number) {
  return predicate((pos, world) => {
    const { soilLevel } = world.generatorInfo(pos);
    const { y } = pos;
    return y - soilLevel > level;
  });
}

export function betweenSoilDepth(min: number, max: number) {
  return predicate((pos, world) => {
    const { soilLevel } = world.generatorInfo(pos);
    const { y } = pos;
    return y - soilLevel > min && y - soilLevel < max;
  });
}

/**
 * heightScalar * waterValue > 1
 */
export const nearDeepWaterMaxima = predicate((pos, world) => {
  const { heightScalar, waterValue } = world.generatorInfo(pos);
  return heightScalar * waterValue > 1;
});

/**
 * waterValue > 0.93
 */
export const nearWaterMaxima = predicate((pos, world) => {
  const { waterValue } = world.generatorInfo(pos);
  return waterValue > 0.93;
});

export const atMaxima = (scalar: TileScalar) =>
  predicate((pos, world) => {
    const value = scalar(pos, world);
    let dirName: Directions;
    for (dirName in DIRECTIONS) {
      const dir = DIRECTIONS[dirName];
      const dValue = scalar(pos.clone().add(dir), world);
      if (dValue > value) {
        return false;
      }
    }
    return true;
  });

// on average every 5x5 square will hit this once
export const atWaterMaxima = atMaxima((pos, world) => world.generatorInfo(pos).waterValue);

export const air = fill(Air);
export const rock = fill(Rock);
export const silt = addWater(fill(Silt));
export const clay = addWater(fill(Clay));
export const sand = addWater(fill(Sand));

export const fountain: TileGenerator = (pos, world) => {
  const { heightScalar, waterValue } = world.generatorInfo(pos);
  const emitWaterScalar = Math.min(heightScalar * waterValue, 1);
  const { y } = pos;
  return new Fountain(
    pos,
    world,
    Math.round(3 / emitWaterScalar),
    map(y, world.height / 2, world.height, 100, 300) + randInt(-10, 10)
  );
};

export const smallFountain: TileGenerator = (pos, world) => {
  return new Fountain(pos, world, 3, 75 + randInt(-10, 10));
};
