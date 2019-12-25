import { Vector2 } from "three";
import { clamp, map } from "../../../../math";
import { params } from "../../params";
import { SOIL_INVENTORY_CAPACITY } from "../constants";
import { Fountain, Rock, Soil, Tile } from "../tile";
import { World } from "../world";

export type TileGenerator = (pos: Vector2, world: World) => Tile | undefined;

export const pointsFilter = (gen: TileGenerator, points: Vector2[]): TileGenerator => {
  return (pos, world) => {
    if (points.find((p) => p.equals(pos)) != null) {
      return gen(pos, world);
    }
  };
};

/**
 * The first gen takes precedence over later ones.
 */
export const layers = (...gens: TileGenerator[]): TileGenerator => {
  return (pos, world) => {
    for (const g of gens) {
      const tile = g(pos, world);
      if (tile) {
        return tile;
      }
    }
  };
};

const Temperate: TileGenerator = (pos, world) => {
  const { noiseHeight, noiseWater, noiseRock } = world.generatorContext;
  const { x, y } = pos;
  const soilLevel =
    world.height / 2 - (4 * (noiseHeight.perlin2(0, x / 5) + 1)) / 2 - 16 * noiseHeight.perlin2(10, x / 20 + 10);
  if (y > soilLevel) {
    const rockThreshold = map(y - world.height / 2, 0, world.height / 2, -0.7, 0.3);
    const isRock = noiseRock.simplex2(x / 5, y / 5) < rockThreshold;
    if (isRock) {
      const rock = new Rock(pos, world);
      return rock;
    } else {
      const heightScalar = Math.pow(map(y - world.height / 2, 0, world.height / 2, 0.5, 1), 2);
      const simplexScalar = 0.2;
      // the + at the end makes a *huge* difference
      const simplexValue = noiseWater.simplex2(x * simplexScalar, y * simplexScalar) + 0.2;

      const water = Math.round(
        clamp((simplexValue > 0.4 ? heightScalar : 0) * SOIL_INVENTORY_CAPACITY, 1, SOIL_INVENTORY_CAPACITY)
      );
      const isFountain = simplexValue > 1 && y - soilLevel > 5;
      if (isFountain) {
        return new Fountain(pos, water, world, 3, map(y, world.height / 2, world.height, 100, 300));
      }
      if (heightScalar * simplexValue > 1 / params.fountainAppearanceRate) {
        const emitWaterScalar = Math.min(heightScalar * simplexValue, 1);
        return new Fountain(
          pos,
          water,
          world,
          Math.round(params.fountainSecondsPerWater / emitWaterScalar),
          map(y, world.height / 2, world.height, 100, 300)
        );
      } else {
        return new Soil(pos, water, world);
      }
    }
  }
};

const Desert: TileGenerator = (pos, world) => {
  const { noiseHeight, noiseRock } = world.generatorContext;
  const { x, y } = pos;
  const soilLevel =
    world.height / 2 - (2 * (noiseHeight.perlin2(0, x / 20) + 1)) / 2 - 3 * noiseHeight.perlin2(10, x / 100 + 10);
  const rockThreshold = map(y, world.height / 2, world.height, -0.8, -0.4);
  const isRock = noiseRock.simplex2(x / 4, y / 4) < rockThreshold;
  if (y > soilLevel) {
    if (isRock) {
      return new Rock(pos, world);
    }
    const water = Math.floor(Math.max(0, map(y, world.height * 0.75, world.height, 1, 9)));
    return new Soil(pos, water, world);
  }
};

const Rocky: TileGenerator = (pos, world) => {
  const { noiseHeight, noiseRock } = world.generatorContext;
  const { x, y } = pos;
  const soilLevel =
    world.height * 0.55 -
    (4 * (noiseHeight.perlin2(0, x / 5) + 1)) / 2 -
    16 * noiseHeight.perlin2(10, x / 20 + 10) -
    map(x, 0, world.width, 10, -10);
  const rockLevel = y - (6 * (noiseHeight.perlin2(0, x / 25) + 1)) / 2 - 20 * noiseHeight.perlin2(10, x / 150 + 10);
  const rockThreshold = rockLevel < world.height * 0.5 ? -1 : -0.15;
  const isRock = noiseRock.simplex2(x / 10, y / 10) < rockThreshold;
  if (isRock) {
    const rock = new Rock(pos, world);
    return rock;
  } else if (y > soilLevel) {
    return new Soil(pos, 3, world);
  }
};

const Reservoires: TileGenerator = (pos, world) => {
  const { noiseHeight, noiseWater, noiseRock } = world.generatorContext;
  const { x, y } = pos;
  const soilLevel =
    world.height / 2 - (4 * (noiseHeight.perlin2(0, x / 5) + 1)) / 2 - 16 * noiseHeight.perlin2(10, x / 20 + 10);
  // const isRock = Math.abs(noiseRock.simplex2(x / 10, y / 10)) < 0.1;
  const isRockHere = Math.sin(x / 4 + y / 30) ** 2 + Math.cos(y / 4) ** 2 > 1.2;
  const isRockBelow = Math.sin(x / 4 + (y + 1) / 30) ** 2 + Math.cos((y + 1) / 4) ** 2 > 1.2;

  const isRock = isRockHere && !isRockBelow;
  if (isRock && y + 1 > soilLevel) {
    return new Rock(pos, world);
  }
  if (y > soilLevel) {
    return new Soil(pos, 2, world);
  }
};

const SkySoil: TileGenerator = (pos, world) => {
  const { noiseHeight, noiseWater, noiseRock } = world.generatorContext;
  const { x, y } = pos;

  const p = 2.5;
  const soilLevel = Math.sin(x / p + y / 12) ** 2 + Math.cos(y / p) ** 2 + noiseHeight.perlin2(x / 4, y / 26);

  if (soilLevel > 1.2 && y > 80 - soilLevel * 20) {
    return new Soil(pos, Math.floor(5 * (soilLevel - 1.1)), world);
  }

  const soilLevelBase =
    (world.height / 2) * 1.2 -
    (4 * (noiseHeight.perlin2(0, x / 5) + 1)) / 2 -
    16 * noiseHeight.perlin2(10, x / 20 + 10);
  if (y > soilLevelBase) {
    return new Soil(pos, 2, world);
  }
};

export const TileGenerators = { Temperate, Desert, Rocky, Reservoires, SkySoil };
export type TileGeneratorName = keyof typeof TileGenerators;
