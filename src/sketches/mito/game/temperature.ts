import { Cell, Tile } from "./tile";

export enum Temperature {
  Scorching = "Scorching",
  Hot = "Hot",
  Mild = "Mild",
  Cold = "Cold",
  Freezing = "Freezing",
}

export function temperatureFor(t: number) {
  if (t <= 0) {
    return Temperature.Freezing;
  } else if (t <= 32) {
    return Temperature.Cold;
  } else if (t <= 64) {
    return Temperature.Mild;
  } else if (t <= 96) {
    return Temperature.Hot;
  } else {
    return Temperature.Scorching;
  }
}

export function nextTemperature(t: Cell, neighbors: Map<any, Tile>, dt: number): number {
  const temperature = t.temperatureFloat;
  let averageTemperature = temperature;
  for (const tile of neighbors.values()) {
    averageTemperature += tile.temperatureFloat;
  }
  averageTemperature /= (neighbors.size + 1);
  return temperature * 0.8 + averageTemperature * 0.2;
}
