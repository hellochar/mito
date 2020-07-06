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
      return Desert;
    case 6:
      return Mound;
    case 7:
      return InverseMound;
    case 8:
      return Pillars;
    case 9:
      return RockMaze;
    case 10:
      return CliffSide;
    case 11:
      return MountainSide;
    case 12:
      return MountainTop;
    default:
      return Level0;
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
  temperaturePerSeason: [18, 56, 52, 43],
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

export const Mound: Environment = {
  insectsPerDay: 0,
  airEvaporation: 0.3,
  climate: {
    timeBetweenRainfall: 50,
    rainDuration: 3,
    waterPerSecond: 120,
  },
  secondsToEvaporate: 120,
  floorCo2: 0.5,
  temperaturePerSeason: [41, 50, 23, -10],
  fill: "Mound",
};

export const InverseMound: Environment = {
  insectsPerDay: 2,
  airEvaporation: 0.5,
  climate: {
    timeBetweenRainfall: 40,
    rainDuration: 3,
    waterPerSecond: 120,
  },
  secondsToEvaporate: 12,
  floorCo2: 0.5,
  temperaturePerSeason: [84, 96, 120, 50],
  fill: "InverseMound",
};

export const Pillars: Environment = {
  insectsPerDay: 0,
  airEvaporation: 0.02,
  climate: {
    // 17.778
    timeBetweenRainfall: 90,
    rainDuration: 8,
    waterPerSecond: 200,
  },
  secondsToEvaporate: 300,
  floorCo2: 0.8,
  temperaturePerSeason: [12, 9, 26, -12],
  fill: "Pillars",
};

export const RockMaze: Environment = {
  insectsPerDay: 0,
  airEvaporation: 0.1,
  climate: {
    // 13.333
    timeBetweenRainfall: 30,
    rainDuration: 2,
    waterPerSecond: 200,
  },
  secondsToEvaporate: 60,
  floorCo2: 0.5,
  temperaturePerSeason: [84, 110, 50, 0],
  fill: "RockMaze",
};

export const CliffSide: Environment = {
  insectsPerDay: 0,
  airEvaporation: 0.1,
  climate: {
    rainDuration: 4,
    timeBetweenRainfall: 90,
    waterPerSecond: 200,
  },
  secondsToEvaporate: 1000,
  floorCo2: 2,
  temperaturePerSeason: [50, 56, 64, 31],
  fill: "CliffSide",
};

export const MountainSide: Environment = {
  insectsPerDay: 0,
  airEvaporation: 0.02,
  climate: {
    rainDuration: 11,
    timeBetweenRainfall: 130,
    waterPerSecond: 250,
  },
  secondsToEvaporate: 120,
  floorCo2: 0.5,
  temperaturePerSeason: [25, 50, 64, 0],
  fill: "MountainSide",
};

export const MountainTop: Environment = {
  insectsPerDay: 0,
  airEvaporation: 0.02,
  climate: {
    rainDuration: 11,
    timeBetweenRainfall: 130,
    waterPerSecond: 250,
  },
  secondsToEvaporate: 120,
  floorCo2: 0.5,
  temperaturePerSeason: [25, 50, 64, 0],
  fill: "Random",
};
