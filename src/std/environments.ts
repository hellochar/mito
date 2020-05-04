import { LevelInfo } from "core/overworld/levelInfo";
import { Environment } from "../core/environment";

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

export const Level0: Environment = {
  insectsPerDay: 0,
  airEvaporation: 0.2,
  climate: {
    // 9 water/sec
    timeBetweenRainfall: 70,
    rainDuration: 3,
    waterPerSecond: 210,
  },
  secondsToEvaporate: 166,
  floorCo2: 0.5,
  temperaturePerSeason: [48, 56, 52, 43],
  fill: "Level0",
};

export const Temperate: Environment = {
  insectsPerDay: 1,
  airEvaporation: 0.3,
  climate: {
    // 10.2 water/sec
    timeBetweenRainfall: 65,
    rainDuration: 3,
    waterPerSecond: 220,
  },
  secondsToEvaporate: 166,
  floorCo2: 0.5,
  temperaturePerSeason: [53, 81, 43, 20],
  fill: "Temperate",
};

export const Reservoires: Environment = {
  insectsPerDay: 1,
  airEvaporation: 0.3,
  climate: {
    // 12 water/sec (!)
    timeBetweenRainfall: 20,
    rainDuration: 8,
    waterPerSecond: 30,
  },
  secondsToEvaporate: 166,
  floorCo2: 0.5,
  temperaturePerSeason: [53, 75, 43, 25],
  fill: "Reservoires",
};

export const Rocky: Environment = {
  insectsPerDay: 0,
  airEvaporation: 0.03,
  climate: {
    // 12.96 water/sec, but much longer apart
    timeBetweenRainfall: 83.333,
    rainDuration: 6,
    waterPerSecond: 180,
  },
  secondsToEvaporate: 166,
  floorCo2: 0.8,
  temperaturePerSeason: [40, 62, 36, 15],
  fill: "Rocky",
};

export const SkySoil: Environment = {
  insectsPerDay: 0,
  airEvaporation: 0.3,
  climate: {
    // 10.5 water/sec; often, but small rains
    timeBetweenRainfall: 12,
    rainDuration: 6,
    waterPerSecond: 21,
  },
  secondsToEvaporate: 166,
  floorCo2: 0.5,
  // start cold
  temperaturePerSeason: [18, 62, 36, 15],
  fill: "SkySoil",
};

export const Desert: Environment = {
  insectsPerDay: 0,
  airEvaporation: 0.3,
  climate: {
    // 12.66 water/sec, very far apart
    timeBetweenRainfall: 110,
    rainDuration: 6.3333,
    waterPerSecond: 220,
  },
  // evaporates quickly!
  secondsToEvaporate: 16,
  // very good co2
  floorCo2: 0.95,
  temperaturePerSeason: [72, 89, 110, 50],
  fill: "Desert",
};
