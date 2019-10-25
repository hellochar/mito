import { randRound } from "math";
import { Tile } from "./tile";

export enum Temperature {
  Scorching = 5,
  Hot = 4,
  Mild = 3,
  Cold = 2,
  Freezing = 1,
}

const TEMPERATURE_NAMES = {
  5: "Scorching",
  4: "Hot",
  3: "Mild",
  2: "Cold",
  1: "Freezing",
};

export function temperatureName(t: Temperature) {
  return TEMPERATURE_NAMES[t];
}

export function nextTemperature(t: Tile, neighbors: Map<any, Tile>, dt: number): Temperature {
  let averageTemperature = t.temperature;
  for (const tile of neighbors.values()) {
    averageTemperature += tile.temperature;
  }
  averageTemperature /= (neighbors.size + 1);
  return randRound(averageTemperature);
}
