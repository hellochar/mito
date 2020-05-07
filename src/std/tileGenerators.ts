import { Vector2 } from "three";
import { Rock } from "../core/tile";
import { Clay, Sand, Silt } from "../core/tile/soil";
import {
  air,
  betweenSoilDepth,
  fountain,
  inRockLevel,
  inSoil,
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
} from "../core/tileGenerator";
import { clamp, map } from "../math";

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
    const s = mixedSoilRock(pos, world)!;
    const water = Math.floor(Math.max(0, map(y, world.height * 0.75, world.height, 1, 9)));
    s.inventory.set(water, 0);
    return s;
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
    const silt = new Silt(pos, world);
    silt.inventory.add(2, 0);
    return silt;
  }
};

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
