import { Noise } from "common/perlin";

export interface GeneratorContext {
  seed: number;
  noiseHeight: Noise;
  noiseRock: Noise;
  noiseWater: Noise;
  noiseSoil: Noise;
  noiseLarge0: Noise;
  noiseMid0: Noise;
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
  };
}
