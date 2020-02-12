import { randInt, randRound } from "math";
import { Air } from "../../sketches/mito/game/tile";
import { params } from "../../sketches/mito/params";
import { PERCENT_DAYLIGHT, TIME_PER_DAY } from "../constants";
import { World } from "./world";
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
    return (Math.atan(Math.sin(this.sunAngle) * 12) / (Math.PI / 2)) * 0.5 + 0.5;
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
      while (numWater > 0) {
        const dropletSize = Math.min(numWater, 1);
        const x = randInt(0, world.width - 1);
        const t = world.tileAt(x, 0);
        if (t instanceof Air) {
          const w = randRound(dropletSize);
          t.inventory.add(w, 0);
          world.numRainWater += w;
        }
        numWater -= 1;
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
        if (t instanceof Air) {
          let sunlight = 0;
          if (y === 0) {
            sunlight = 1;
          } else {
            const tileUp = this.world.tileAt(x, y - 1);
            const tileRight = this.world.tileAt(x + 1, y - 1);
            const tileLeft = this.world.tileAt(x - 1, y - 1);
            const upSunlight = tileUp instanceof Air ? tileUp.sunlightCached / sunAmount : tileUp == null ? 1 : 0;
            const rightSunlight =
              tileRight instanceof Air ? tileRight.sunlightCached / sunAmount : tileRight == null ? 1 : 0;
            const leftSunlight =
              tileLeft instanceof Air ? tileLeft.sunlightCached / sunAmount : tileLeft == null ? 1 : 0;
            if (directionalBias > 0) {
              // positive light travels to the right
              sunlight = rightSunlight * directionalBias + upSunlight * (1 - directionalBias);
            } else {
              sunlight = leftSunlight * -directionalBias + upSunlight * (1 - -directionalBias);
            }
            sunlight =
              sunlight * (1 - params.sunlightDiffusion) +
              ((upSunlight + rightSunlight + leftSunlight) / 3) * params.sunlightDiffusion;
          }
          // have at least a bit
          sunlight = params.sunlightReintroduction + sunlight * (1 - params.sunlightReintroduction);
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
