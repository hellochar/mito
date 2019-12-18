import { LevelInfo } from "overworld/levelInfo";
import { createSimpleSchema, object } from "serializr";
import { Vector2 } from "three";
import { Noise } from "../../../common/perlin";
import { map } from "../../../math";
import { params } from "../params";
import { Fountain, Rock, Soil, Tile } from "./tile";
import { World } from "./world";

export interface Environment {
  airEvaporation: number;
  climate: {
    timeBetweenRainfall: number;
    rainDuration: number;
    waterPerSecond: number;
  };
  waterGravityPerTurn: number;
  evaporationRate: number;
  evaporationBottom: number;
  floorCo2: number;
  temperaturePerSeason: number[];
  fill: FillFunctionName;
}

export function environmentFromLevelInfo(info: LevelInfo) {
  // const { rainfall, soilType, temperature } = levelInfo;

  return info.height < 2 ? Temperate() : info.height < 4 ? Rocky() : Desert();
}

export const EnvironmentSchema = createSimpleSchema<Environment>({
  climate: object(createSimpleSchema({ "*": true })),
  "*": true,
});

export type FillFunction = (pos: Vector2, world: World) => Tile | undefined;

// TODO put this somewhere
const noiseWater = new Noise();
const noiseRock = new Noise();
const noiseHeight = new Noise();

export const FILL_FUNCTIONS = {
  Temperate: [
    (pos, world) => {
      const { x, y } = pos;
      const soilLevel =
        world.height / 2 - (4 * (noiseHeight.perlin2(0, x / 5) + 1)) / 2 - 16 * noiseHeight.perlin2(10, x / 20 + 10);
      const rockThreshold = map(y - world.height / 2, 0, world.height / 2, -0.7, 0.3);
      const isRock = noiseRock.simplex2(x / 5, y / 5) < rockThreshold;
      if (y > soilLevel) {
        if (isRock) {
          const rock = new Rock(pos, world);
          return rock;
        } else {
          const heightScalar = Math.pow(map(y - world.height / 2, 0, world.height / 2, 0.5, 1), 2);
          const simplexScalar = 0.2;
          // this 0.1 factor makes a *huge* difference
          const simplexValue = noiseWater.simplex2(x * simplexScalar, y * simplexScalar) + 0.2;
          const water = Math.round(
            Math.max(
              1,
              Math.min(
                // should be soil_max_water, isn't cuz of dependency cycles messing up instantiation
                20,
                simplexValue > 0.4 ? 20 * heightScalar : 0
              )
            )
          );
          if (heightScalar * simplexValue > 1 / params.fountainAppearanceRate) {
            const emitWaterScalar = Math.min(heightScalar * simplexValue, 1);
            return new Fountain(pos, water, world, Math.round(params.fountainSecondsPerWater / emitWaterScalar));
          } else {
            return new Soil(pos, water, world);
          }
        }
      }
    },
  ] as FillFunction[],
  Desert: [
    (pos, world) => {
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
    },
  ] as FillFunction[],
  Rocky: [
    (pos, world) => {
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
    },
  ] as FillFunction[],
};

export type FillFunctionName = keyof typeof FILL_FUNCTIONS;

export const Temperate = () => {
  const environment: Environment = {
    airEvaporation: 0.3,
    climate: {
      timeBetweenRainfall: 26,
      rainDuration: 1.6,
      waterPerSecond: 60,
    },
    evaporationRate: 0.006,
    evaporationBottom: 0.6,
    floorCo2: 0.3333,
    waterGravityPerTurn: 0.03,
    temperaturePerSeason: [53, 75, 43, 25],
    fill: "Temperate",
  };
  return environment;
};

export const Desert = () => {
  const e: Environment = {
    airEvaporation: 0.3,
    climate: {
      rainDuration: 7.3333,
      timeBetweenRainfall: 110,
      waterPerSecond: 240,
    },
    evaporationRate: 0.06,
    evaporationBottom: 0.7,
    waterGravityPerTurn: 0.6,
    floorCo2: 0.95,
    temperaturePerSeason: [69, 84, 98, 24],
    fill: "Desert",
  };
  return e;
};

export const Rocky = () => {
  const e: Environment = {
    airEvaporation: 0.3,
    climate: {
      timeBetweenRainfall: 83.333,
      rainDuration: 4,
      waterPerSecond: 90,
    },
    waterGravityPerTurn: 3,
    evaporationBottom: 0.6,
    evaporationRate: 0.03,
    floorCo2: 1,
    temperaturePerSeason: [27, 62, 36, 15],
    fill: "Rocky",
  };
  return e;
};

export const ALL_ENVIRONMENTS = {
  Temperate,
  Desert,
  Rocky,
};

export type EnvironmentName = keyof typeof ALL_ENVIRONMENTS;
