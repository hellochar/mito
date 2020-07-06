import { Temperature, temperatureFor } from "core/temperature";
import { clamp, randInt } from "math";
import { PERCENT_DAYLIGHT, SUNLIGHT_DIFFUSION, SUNLIGHT_REINTRODUCTION, TIME_PER_DAY } from "../constants";
import { Air } from "../tile";
import { World } from "./world";

const SUNLIGHT_TEMPERATURE_SCALAR = {
  [Temperature.Freezing]: 0.5,
  [Temperature.Cold]: 0.75,
  [Temperature.Mild]: 1,
  [Temperature.Hot]: 1.25,
  [Temperature.Scorching]: 1.5,
};
/**
 * WeatherController is responsible for weather related properties, such as:
 *
 * Temperature of the environment
 * Sunlight
 */
export class WeatherController {
  constructor(public world: World) {}

  /**
   * 0 to 2pi, where
   * 0 to pi: daytime (time of day - 0 to PERCENT_DAYLIGHT)
   * pi to 2pi: nighttime (PERCENT_DAYLIGHT to 1)
   */
  get sunAngle() {
    const timeOfDay = (this.world.time / TIME_PER_DAY) % 1;
    if (timeOfDay < PERCENT_DAYLIGHT) {
      return (timeOfDay / PERCENT_DAYLIGHT) * Math.PI;
    } else {
      return Math.PI * (1 + (timeOfDay - PERCENT_DAYLIGHT) / (1 - PERCENT_DAYLIGHT));
    }
  }

  get sunAmount() {
    const temperatureScalar = SUNLIGHT_TEMPERATURE_SCALAR[temperatureFor(this.getCurrentTemperature())];
    const baseAmount = (Math.atan(Math.sin(this.sunAngle) * 12) / (Math.PI / 2)) * 0.5 + 0.5;
    return baseAmount * temperatureScalar;
  }

  getCurrentTemperature() {
    const { season } = this.world.season;
    return this.world.environment.temperaturePerSeason[season];
  }

  step(dt: number) {
    this.updateTemperatures();
    this.computeSunlight();
    this.stepWeather(dt);
  }

  public stepWeather(dt: number) {
    const world = this.world;
    // offset first rain event by a few seconds
    const isRaining =
      (world.time + world.environment.climate.timeBetweenRainfall - 6) % world.environment.climate.timeBetweenRainfall <
      world.environment.climate.rainDuration;
    if (isRaining) {
      // add multiple random droplets
      let numWater = world.environment.climate.waterPerSecond * dt;
      let guard = 0;
      while (numWater > 0 && guard++ < 100) {
        const dropletSize = clamp(numWater, 0, 1);
        const x = randInt(0, world.width - 1);
        const t = world.tileAt(x, 0);
        if (Air.is(t)) {
          t.inventory.add(dropletSize, 0);
          world.numRainWater += dropletSize;
          numWater -= dropletSize;
        }
      }
    }
  }

  public computeSunlight() {
    // step downards from the top; neighbors don't affect the calculation so
    // we don't have buffering problems
    // TODO allow sunlight to go full 45-to-90 degrees
    const sunAngle = this.sunAngle;
    const directionalBias = Math.sin(sunAngle - Math.PI / 2);
    const sunAmount = this.sunAmount;
    for (let y = 0; y <= this.world.height; y++) {
      for (let x = 0; x < this.world.width; x++) {
        const t = this.world.environmentTileAt(x, y);
        if (Air.is(t)) {
          let sunlight = 0;
          if (y === 0) {
            sunlight = 1;
          } else {
            const tileUp = this.world.tileAt(x, y - 1);
            const tileRight = this.world.tileAt(x + 1, y - 1);
            const tileLeft = this.world.tileAt(x - 1, y - 1);
            const upSunlight = Air.is(tileUp) ? tileUp.sunlightCached / sunAmount : tileUp == null ? 1 : 0;
            const rightSunlight = Air.is(tileRight) ? tileRight.sunlightCached / sunAmount : tileRight == null ? 1 : 0;
            const leftSunlight = Air.is(tileLeft) ? tileLeft.sunlightCached / sunAmount : tileLeft == null ? 1 : 0;
            if (directionalBias > 0) {
              // positive light travels to the right
              sunlight = rightSunlight * directionalBias + upSunlight * (1 - directionalBias);
            } else {
              sunlight = leftSunlight * -directionalBias + upSunlight * (1 - -directionalBias);
            }
            sunlight =
              sunlight * (1 - SUNLIGHT_DIFFUSION) +
              ((upSunlight + rightSunlight + leftSunlight) / 3) * SUNLIGHT_DIFFUSION;
          }
          // have at least a bit
          sunlight = SUNLIGHT_REINTRODUCTION + sunlight * (1 - SUNLIGHT_REINTRODUCTION);
          sunlight *= sunAmount;
          t.sunlightCached = sunlight;
        }
      }
    }
  }

  public updateTemperatures() {
    for (const t of this.world.allCells()) {
      t.temperatureFloat = t.nextTemperature;
    }
  }
}
