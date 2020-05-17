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
