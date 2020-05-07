import { World } from "core";
import { Fountain, Rock, Tile } from "core/tile";
import { clamp } from "lodash";
import { map, randInt } from "math";
import { Vector2 } from "three";
import { Constructor } from "typings/constructor";
import { Air } from "./tile/air";
import { Sand, Silt } from "./tile/soil";

export type TileGenerator = (pos: Vector2, world: World) => Tile | undefined;

export type TileCombiner = (...generators: TileGenerator[]) => TileGenerator;

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

export const air = fill(Air);
export const rock = fill(Rock);
export const sand = fill(Sand);

export const silt: TileGenerator = (pos, world) => {
  const { heightScalar, waterValue } = world.generatorInfo(pos);
  const s = new Silt(pos, world);
  const water = Math.round(clamp((waterValue > 0.4 ? heightScalar : 0) * 10 * 3, 1, 10));
  s.inventory.set(water, 0);
  return s;
};

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

export function not(combiner: TileCombiner): TileCombiner {
  return (...gens: TileGenerator[]): TileGenerator => {
    const originalGenerator = combiner(...gens);
    const gen = layers(...gens);
    return (pos, world) => {
      const t = originalGenerator(pos, world);
      if (t) {
        return undefined;
      } else {
        return gen(pos, world);
      }
    };
  };
}

export const inSoil = predicate((pos, world) => {
  const { soilLevel } = world.generatorInfo(pos);
  const { y } = pos;
  return y > soilLevel;
});

export function inRockLevel(midLevel = -0.8, bottomLevel = 0.3) {
  return predicate((pos, world) => {
    const { y } = pos;
    const { height } = world;
    const { rockLevel } = world.generatorInfo(pos);
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
