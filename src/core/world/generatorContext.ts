import { Noise } from "common/perlin";
import { poissonDisc } from "math/poissonDisc";
import seedrandom from "seedrandom";
import { Vector2 } from "three";

export interface GeneratorContext {
  seed: number;
  noiseHeight: Noise;
  noiseRock: Noise;
  noiseWater: Noise;
  noiseSoil: Noise;
  noiseLarge0: Noise;
  noiseMid0: Noise;
  noiseMix: Noise;
  poissonSmall: Vector2[];
  poissonMed: Vector2[];
}

export interface GeneratorInfo {
  soilLevel: number;
  soilLevelFlat: number;

  /**
   * 20x20 simplex in [-1, 1]
   */
  large0: number;

  /**
   * 10x10 simplex in [-1, 1]
   */
  mid0: number;

  /**
   * (y/height)**2; useful for placing objects deep down.
   */
  heightScalar: number;
  /**
   * 5x5 simplex noise in [-0.85, 1.15]
   */
  waterValue: number;
}

function modulateSeed(seed: number, key: string) {
  for (const letter of key) {
    seed |= seed << (7 + letter.charCodeAt(0) ** 2);
  }
  return seed;
}

export function createGeneratorContext(seed: number): GeneratorContext {
  return {
    seed,
    noiseHeight: new Noise(modulateSeed(seed, "height")),
    noiseRock: new Noise(modulateSeed(seed, "rock")),
    noiseWater: new Noise(modulateSeed(seed, "water")),
    noiseSoil: new Noise(modulateSeed(seed, "soil")),
    noiseLarge0: new Noise(modulateSeed(seed, "large0")),
    noiseMid0: new Noise(modulateSeed(seed, "mid0")),
    noiseMix: new Noise(modulateSeed(seed, "mix")),
    poissonSmall: makePoissonPoints(modulateSeed(seed, "poissonSmall"), 5),
    poissonMed: makePoissonPoints(modulateSeed(seed, "poissonMed"), 10),
  };
}

/**
 * Create an array of poisson-disc sampled points with distance d, within a 50x100 world
 */
function makePoissonPoints(seed: number, distance: number): Vector2[] {
  const random = seedrandom(seed.toString());
  const samples = poissonDisc({
    width: 50,
    height: 100,
    radius: distance,
    rng: random,
    max: 5000 / distance,
  });
  const minVector = new Vector2();
  const maxVector = new Vector2(50 - 1, 100 - 1);
  for (const s of samples) {
    s.round();
    s.clamp(minVector, maxVector);
  }
  return samples;
}
