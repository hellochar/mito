import { Tile } from "core/tile";
import { createSimpleSchema, object } from "serializr";
import { Vector2 } from "three";
import { World } from ".";
import { TileGeneratorName } from "../std/tileGenerators";

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

export type TileGenerator = (pos: Vector2, world: World) => Tile | undefined;

export const EnvironmentSchema = createSimpleSchema<Environment>({
  climate: object(createSimpleSchema({ "*": true })),
  "*": true,
});
