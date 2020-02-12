import { lerp } from "math";

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

export function nextTemperature(currentTemperature: number, neighborTemperatures: number[], dt: number): number {
  let averageTemperature = currentTemperature;
  for (const temp of neighborTemperatures) {
    averageTemperature += temp;
  }
  averageTemperature /= neighborTemperatures.length + 1;
  // TODO maybe use proper dt-scaling lerp
  return lerp(currentTemperature, averageTemperature, Math.min(6 * dt, 1));
}
