import { LevelInfo } from "overworld/levelInfo";
import { createSimpleSchema, object } from "serializr";
import { TileGenerator, TileGeneratorName } from "./tileGenerators";

export interface Environment {
  airEvaporation: number;
  climate: {
    timeBetweenRainfall: number;
    rainDuration: number;
    waterPerSecond: number;
  };
  secondsToEvaporate: number;
  floorCo2: number;
  temperaturePerSeason: number[];
  fill: TileGeneratorName | TileGenerator;
}

export function environmentFromLevelInfo(info: LevelInfo) {
  // const { rainfall, soilType, temperature } = levelInfo;

  switch (info.height) {
    case 0:
      return Level0;
    case 1:
      return Temperate;
    case 2:
      return Reservoires;
    case 3:
      return Rocky;
    case 4:
      return SkySoil;
    case 5:
    default:
      return Desert;
  }
  // return Reservoires;
}

export const EnvironmentSchema = createSimpleSchema<Environment>({
  climate: object(createSimpleSchema({ "*": true })),
  "*": true,
});

export const Level0: Environment = {
  airEvaporation: 0.2,
  climate: {
    timeBetweenRainfall: 40,
    rainDuration: 2,
    waterPerSecond: 100,
  },
  secondsToEvaporate: 166,
  floorCo2: 0.5,
  temperaturePerSeason: [51, 56, 52, 43],
  fill: "Level0",
};

export const Temperate: Environment = {
  airEvaporation: 0.3,
  climate: {
    timeBetweenRainfall: 40,
    rainDuration: 2,
    waterPerSecond: 100,
  },
  secondsToEvaporate: 166,
  floorCo2: 0.5,
  temperaturePerSeason: [53, 75, 43, 25],
  fill: "Temperate",
};

export const Reservoires: Environment = {
  airEvaporation: 0.3,
  climate: {
    timeBetweenRainfall: 30,
    rainDuration: 8,
    waterPerSecond: 20,
  },
  secondsToEvaporate: 166,
  floorCo2: 0.5,
  temperaturePerSeason: [53, 75, 43, 25],
  fill: "Reservoires",
};

export const Rocky: Environment = {
  airEvaporation: 0.3,
  climate: {
    timeBetweenRainfall: 83.333,
    rainDuration: 4,
    waterPerSecond: 90,
  },
  secondsToEvaporate: 33,
  floorCo2: 1,
  temperaturePerSeason: [40, 62, 36, 15],
  fill: "Rocky",
};

export const SkySoil: Environment = {
  airEvaporation: 0.3,
  climate: {
    timeBetweenRainfall: 83.333,
    rainDuration: 4,
    waterPerSecond: 90,
  },
  secondsToEvaporate: 33,
  floorCo2: 1,
  temperaturePerSeason: [27, 62, 36, 15],
  fill: "SkySoil",
};

export const Desert: Environment = {
  airEvaporation: 0.3,
  climate: {
    rainDuration: 7.3333,
    timeBetweenRainfall: 110,
    waterPerSecond: 240,
  },
  secondsToEvaporate: 16,
  floorCo2: 0.95,
  temperaturePerSeason: [69, 84, 98, 24],
  fill: "Desert",
};
