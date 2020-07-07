import { createSimpleSchema, object } from "serializr";
import { TileGeneratorName } from "../std/tileGenerators";
import { Temperature } from "./temperature";
import { TileGenerator } from "./tileGenerator";

export interface Environment {
  airEvaporation: number;
  climate: {
    timeBetweenRainfall: number;
    rainDuration: number;
    waterPerSecond: number;
  };
  insectsPerDay: number;
  secondsToEvaporate: number;
  floorCo2: number;
  temperaturePerSeason: Temperature[];
  fill: TileGeneratorName | TileGenerator;
}

export const EnvironmentSchema = createSimpleSchema<Environment>({
  climate: object(createSimpleSchema({ "*": true })),
  "*": true,
});
