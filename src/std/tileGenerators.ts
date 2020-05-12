import { World } from "core";
import { Matrix3, Vector2 } from "three";
import { Rock } from "../core/tile";
import { Clay, Sand, Silt } from "../core/tile/soil";
import {
  addDeepWater,
  air,
  atWaterMaxima,
  betweenSoilDepth,
  fountain,
  inRockLevel,
  inSoil,
  inSoilFlat,
  layers,
  nearDeepWaterMaxima,
  nearWaterMaxima,
  pastSoilDepth,
  predicate,
  rock,
  silt,
  smallFountain,
  TileCombiner,
  TileGenerator,
  TileScalar,
} from "../core/tileGenerator";
import { clamp, logistic, map } from "../math";

const mixedSoilRock: TileGenerator = (pos, world) => {
  const { noiseSoil } = world.generatorContext;
  const { x, y } = pos;
  const level = noiseSoil.octaveSimplex2(x / 10, y / 10);
  const s = new (level < -0.37 ? Sand : level < 0.37 ? Silt : level < 1.2 ? Clay : Rock)(pos, world);
  const water = clamp(level * 30, 1, 20);
  s.inventory.add(water, 0);
  return s;
};

export const inPillar = predicate((pos, world) => {
  const { soilLevel } = world.generatorInfo(pos);
  const { x, y } = pos;
  const inPillar = x % 9 < 2 && Math.abs(y - soilLevel) < 8;
  return inPillar;
});

export function skewX(amount: number): TileCombiner {
  return (...generators: TileGenerator[]): TileGenerator => {
    const gen = layers(...generators);
    return (pos, world) => {
      const newY = Math.round(pos.y + (world.width / 2 - pos.x) * amount);
      const skewPos = new Vector2(pos.x, newY);
      const tile = gen(skewPos, world);
      if (tile) {
        tile.pos = pos;
        return tile;
      }
    };
  };
}

export const transformFn = (newPosFn: (pos: Vector2, world: World) => Vector2): TileCombiner => {
  return (...generators) => {
    const gen = layers(...generators);
    return (pos, world) => {
      const newPos = newPosFn(pos.clone(), world);
      const tile = gen(newPos, world);
      if (tile) {
        tile.pos = pos;
        return tile;
      }
    };
  };
};

export function transform(matrix: Matrix3): TileCombiner {
  return transformFn((pos, world) => pos.applyMatrix3(matrix));
}

export function translate(x: number, y: number): TileCombiner {
  return transform(new Matrix3().translate(x, y));
}

export function translateX(x: number) {
  return translate(x, 0);
}

export function translateY(y: number) {
  return translate(0, y);
}

/**
 * The center of the map gets translated up by `tall` tiles. This falls off
 * with a logistic curve of steepness `k` over `width` pixels.
 */
export const moundShape = (wide: number, tall: number, k = 1) =>
  transformFn((pos, world) => {
    const dy = tall * logistic(map(Math.abs(pos.x - world.width / 2), 0, wide, 6, -6), k);
    pos.y += dy;
    return pos;
  });

export const inLarge0 = predicate((pos, world) => world.generatorInfo(pos).large0 > 0.5);

const Level0: TileGenerator = layers(
  air,
  // skewX(0.75)
  inSoil(
    silt,
    pastSoilDepth(8)(nearDeepWaterMaxima(fountain)),
    betweenSoilDepth(5, 13)(nearWaterMaxima(smallFountain)),
    inRockLevel(-0.8, 0.3)(rock)
  )
  // inPillar(mixedSoilRock)
);

const Temperate: TileGenerator = layers(
  air,
  inSoil(
    mixedSoilRock,
    pastSoilDepth(8)(nearDeepWaterMaxima(fountain)),
    betweenSoilDepth(5, 13)(nearWaterMaxima(smallFountain)),
    inRockLevel(-0.7, 0.3)(rock)
  )
);

const Desert: TileGenerator = layers(
  air,
  inSoilFlat(
    addDeepWater(mixedSoilRock),
    // wavelength 4 creates much more single dot rocks.
    // -0.4 at bottom creates more open space
    inRockLevel(-0.8, -0.4, 4)(rock)
  )
);

/**
 * Whether the a 10x10 simplex2 is > rockThreshold
 */
const inBigRock = (rockThreshold: TileScalar = (pos, world) => map(pos.y, 0, world.height, 1, 0)) =>
  predicate((pos, world) => {
    const { generatorContext, height } = world;
    const { noiseHeight, noiseRock } = generatorContext;
    const { x, y } = pos;
    const isRock = noiseRock.simplex2(x / 10, y / 10) > rockThreshold(pos, world);
    return isRock;
  });

/**
 * Only when original is defined, then run the generators, or default to original.
 */
const onlyIn = (original: TileGenerator): TileCombiner => (...generators) => {
  const gen = layers(...generators);
  return (pos, world) => {
    const tile = original(pos, world);
    if (tile != null) {
      return gen(pos, world) || tile;
    }
  };
};

const Rocky: TileGenerator = layers(
  air,
  onlyIn(
    // put soil level 5 y lower; creates more space for the rocks to live
    skewX(0.4)(translateY(-5)(inSoil(silt)))
  )(
    // sprinkle fountains all around
    atWaterMaxima(smallFountain)
  ),
  // rocks can go up to 5 tiles above the final soil level (plus more on edges where skewed)
  inSoil(inBigRock()(rock))

  // cool big mound shape thing
  // moundShape(25, -25, 5)(translateY(25)(inSoil(silt)))
);

const Reservoires: TileGenerator = (pos, world) => {
  const { noiseHeight } = world.generatorContext;
  const { x, y } = pos;
  const soilLevel =
    world.height / 2 - (4 * (noiseHeight.perlin2(0, x / 5) + 1)) / 2 - 16 * noiseHeight.perlin2(10, x / 20 + 10);
  // const isRock = Math.abs(noiseRock.simplex2(x / 10, y / 10)) < 0.1;
  const isRockHere = Math.sin(x / 4 + y / 30) ** 2 + Math.cos(y / 4) ** 2 > 1.2;
  const isRockBelow = Math.sin(x / 4 + (y + 2) / 30) ** 2 + Math.cos((y + 2) / 4) ** 2 > 1.2;

  const isRock = isRockHere && !isRockBelow;
  if (isRock && y + 1 > soilLevel) {
    return new Rock(pos, world);
  }
  if (y > soilLevel) {
    return mixedSoilRock(pos, world);
  }
};

const SkySoil: TileGenerator = (pos, world) => {
  const { noiseHeight } = world.generatorContext;
  const { x, y } = pos;

  const p = 2.5;
  const soilLevel = Math.sin(x / p + y / 12) ** 2 + Math.cos(y / p) ** 2 + noiseHeight.perlin2(x / 4, y / 26);

  if (soilLevel > 1.2 && y > 80 - soilLevel * 20) {
    const s = new Silt(pos, world);
    s.inventory.add(Math.floor(5 * (soilLevel - 1.1)), 0);
    return s;
  }

  const soilLevelBase =
    (world.height / 2) * 1.2 -
    (4 * (noiseHeight.perlin2(0, x / 5) + 1)) / 2 -
    16 * noiseHeight.perlin2(10, x / 20 + 10);
  if (y > soilLevelBase) {
    return mixedSoilRock(pos, world);
  }
};

export const TileGenerators = { Level0, Temperate, Desert, Rocky, Reservoires, SkySoil };
export type TileGeneratorName = keyof typeof TileGenerators;
