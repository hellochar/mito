import { LevelInfo } from "overworld/levelInfo";
import { createSimpleSchema, object } from "serializr";
import { TileGeneratorName } from "./tileGenerators";

export interface Environment {
  airEvaporation: number;
  climate: {
    timeBetweenRainfall: number;
    rainDuration: number;
    waterPerSecond: number;
  };
  evaporationRate: number;
  evaporationBottom: number;
  floorCo2: number;
  temperaturePerSeason: number[];
  fill: TileGeneratorName;
}

export function environmentFromLevelInfo(info: LevelInfo) {
  // const { rainfall, soilType, temperature } = levelInfo;

  switch (info.height) {
    case 0:
      return Temperate;
    case 1:
      return Reservoires;
    case 2:
      return Rocky;
    case 3:
      return SkySoil;
    case 4:
    default:
      return Desert;
  }
  // return Reservoires;
}

export const EnvironmentSchema = createSimpleSchema<Environment>({
  climate: object(createSimpleSchema({ "*": true })),
  "*": true,
});

export const Temperate: Environment = {
  airEvaporation: 0.3,
  climate: {
    timeBetweenRainfall: 26,
    rainDuration: 1.6,
    waterPerSecond: 60,
  },
  evaporationRate: 0.006,
  evaporationBottom: 0.6,
  floorCo2: 0.3333,
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
  evaporationRate: 0.006,
  evaporationBottom: 0.1,
  floorCo2: 0.5,
  temperaturePerSeason: [53, 75, 43, 25],
  fill: "Reservoires",
};

export const Desert: Environment = {
  airEvaporation: 0.3,
  climate: {
    rainDuration: 7.3333,
    timeBetweenRainfall: 110,
    waterPerSecond: 240,
  },
  evaporationRate: 0.06,
  evaporationBottom: 0.7,
  floorCo2: 0.95,
  temperaturePerSeason: [69, 84, 98, 24],
  fill: "Desert",
};

export const Rocky: Environment = {
  airEvaporation: 0.3,
  climate: {
    timeBetweenRainfall: 83.333,
    rainDuration: 4,
    waterPerSecond: 90,
  },
  evaporationBottom: 0.6,
  evaporationRate: 0.03,
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
  evaporationBottom: 0.6,
  evaporationRate: 0.03,
  floorCo2: 1,
  temperaturePerSeason: [27, 62, 36, 15],
  fill: "SkySoil",
};
