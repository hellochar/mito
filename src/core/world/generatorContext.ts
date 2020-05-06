import { Noise } from "common/perlin";

export interface GeneratorContext {
  seed: number;
  noiseHeight: Noise;
  noiseRock: Noise;
  noiseWater: Noise;
  noiseSoil: Noise;
}

export interface GeneratorInfo {
  soilLevel: number;
  /**
   * whether rock lives here.
   */
  rockLevel: number;

  /**
   * (y/height)**2; useful for placing objects deep down.
   */
  heightScalar: number;
  /**
   * 5x5 simplex noise.
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
  };
}
