import { World } from "core";
import { Directions, DIRECTIONS } from "core/directions";
import { Matrix3, Vector2 } from "three";
import { Rock, Tile } from "../core/tile";
import { Clay, Sand, Silt } from "../core/tile/soil";
import {
  addDeepWater,
  air,
  atWaterMaxima,
  betweenSoilDepth,
  fountain,
  inRockLevel,
  inSoil,
  inSoilFlat,
  layers,
  nearDeepWaterMaxima,
  nearWaterMaxima,
  not,
  pastSoilDepth,
  predicate,
  rock,
  silt,
  smallFountain,
  TileCombiner,
  TileGenerator,
  TileScalar,
} from "../core/tileGenerator";
import { clamp, logistic, map } from "../math";

const mixedSoilRockSmall: TileGenerator = (pos, world) => {
  const { noiseSoil } = world.generatorContext;
  const { x, y } = pos;
  const level = noiseSoil.octaveSimplex2(x / 10, y / 10);
  const s = new (level < -0.37 ? Sand : level < 0.37 ? Silt : level < 1.2 ? Clay : Rock)(pos, world);
  const water = clamp(level * 30, 1, 20);
  s.inventory.add(water, 0);
  return s;
};

const mixedSoilRockMed: TileGenerator = (pos, world) => {
  const { noiseSoil } = world.generatorContext;
  const { x, y } = pos;
  const level = noiseSoil.octaveSimplex2(x / 15 + 19.3291, y / 15 + 595.3, 3, 0.4);
  const s = new (level < -0.5 ? Sand : level < 0.5 ? Silt : Clay)(pos, world);
  const water = clamp(level * 30, 1, 20);
  s.inventory.add(water, 0);
  return s;
};

export const inPillar = predicate((pos, world) => {
  const { soilLevel } = world.generatorInfo(pos);
  const { x, y } = pos;
  const inPillar = x % 9 < 2 && Math.abs(y - soilLevel) < 8;
  return inPillar;
});

export function skewX(amount: number): TileCombiner {
  return (...generators: TileGenerator[]): TileGenerator => {
    const gen = layers(...generators);
    return (pos, world) => {
      const newY = Math.round(pos.y + (world.width / 2 - pos.x) * amount);
      const skewPos = new Vector2(pos.x, newY);
      const tile = gen(skewPos, world);
      if (tile) {
        tile.pos = pos;
        return tile;
      }
    };
  };
}

export const transformFn = (newPosFn: (pos: Vector2, world: World) => Vector2): TileCombiner => {
  return (...generators) => {
    const gen = layers(...generators);
    return (pos, world) => {
      const newPos = newPosFn(pos.clone(), world);
      const tile = gen(newPos, world);
      if (tile) {
        tile.pos = pos;
        return tile;
      }
    };
  };
};

export function transform(matrix: Matrix3): TileCombiner {
  return transformFn((pos, world) => pos.applyMatrix3(matrix));
}

export function translate(x: number, y: number): TileCombiner {
  return transform(new Matrix3().translate(x, y));
}

export function translateX(x: number) {
  return translate(x, 0);
}

export function translateY(y: number) {
  return translate(0, y);
}

export function rotate(theta: number) {
  return transform(new Matrix3().rotate(theta));
}

export function scale(sx: number, sy: number) {
  return transform(new Matrix3().scale(sx, sy));
}

/**
 * The center of the map gets translated up by `tall` tiles. This falls off
 * with a logistic curve of steepness `k` over `width` pixels.
 */
export const moundShape = (wide: number, tall: number, k = 1) =>
  transformFn((pos, world) => {
    const dy = tall * logistic(map(Math.abs(pos.x - world.width / 2), 0, wide, 6, -6), k);
    pos.y += dy;
    return pos;
  });

export const inLarge0 = predicate((pos, world) => world.generatorInfo(pos).large0 > 0.5);

const Level0: TileGenerator = layers(
  air,
  // skewX(0.75)
  inSoil(
    silt,
    pastSoilDepth(8)(nearDeepWaterMaxima(fountain)),
    betweenSoilDepth(5, 13)(nearWaterMaxima(smallFountain)),
    inRockLevel(-0.8, 0.3)(rock)
  )
  // inPillar(mixedSoilRock)
);

const Temperate: TileGenerator = layers(
  air,
  inSoil(
    mixedSoilRockSmall,
    pastSoilDepth(8)(nearDeepWaterMaxima(fountain)),
    betweenSoilDepth(5, 13)(nearWaterMaxima(smallFountain)),
    inRockLevel(-0.7, 0.3)(rock)
  )
);

const Desert: TileGenerator = layers(
  air,
  inSoilFlat(
    addDeepWater(mixedSoilRockSmall),
    // wavelength 4 creates much more single dot rocks.
    // -0.4 at bottom creates more open space
    inRockLevel(-0.8, -0.4, 4)(rock)
  )
);

/**
 * Whether the a 10x10 simplex2 is > rockThreshold
 */
const inBigRock = (rockThreshold: TileScalar = (pos, world) => map(pos.y, 0, world.height, 1, 0)) =>
  predicate((pos, world) => {
    const { generatorContext, height } = world;
    const { noiseHeight, noiseRock } = generatorContext;
    const { x, y } = pos;
    const isRock = noiseRock.simplex2(x / 10, y / 10) > rockThreshold(pos, world);
    return isRock;
  });

/**
 * Only when original is defined, then run the generators, or default to original.
 */
const onlyIn = (original: TileGenerator): TileCombiner => (...generators) => {
  const gen = layers(...generators);
  return (pos, world) => {
    const tile = original(pos, world);
    if (tile != null) {
      return gen(pos, world) || tile;
    }
  };
};

const Rocky: TileGenerator = layers(
  air,
  onlyIn(
    // put soil level 5 y lower; creates more space for the rocks to live
    skewX(0.4)(translateY(-5)(inSoil(silt)))
  )(
    // sprinkle fountains all around
    atWaterMaxima(smallFountain)
  ),
  // rocks can go up to 5 tiles above the final soil level (plus more on edges where skewed)
  inSoil(inBigRock()(rock))

  // cool big mound shape thing
  // moundShape(25, -25, 5)(translateY(25)(inSoil(silt)))
);

/**
 * Creates an axis aligned, non-random checkerboard pattern. You can round the edges of the
 * checkboard by bumping the threshold between 1.0 and 2.0.
 *
 * At threshold 0 we basically fill the entire space.
 *
 * At threshold 1.0 we'll make perfect diamonds that touch each other (50% coverage).
 *
 * At threshold 2.0 we basically miss entirely, because of the sampling rate.
 */
const roundedCheckerboard = (wavelength: number, threshold: number = 1.2) =>
  predicate((pos, world) => {
    const { x, y } = pos;
    // sin(x)**2 + cos(y)**2 ranges in [-0.3, 2.3], with intrinsic wavelength PI.
    const c = Math.sin(Math.PI * (x / wavelength)) ** 2 + Math.cos(Math.PI * (y / wavelength)) ** 2;
    return c > threshold;
  });

// only if all generators return a value, return the last one.
const and: TileCombiner = (...generators) => {
  return (pos, world) => {
    let tile: Tile | undefined;
    for (const g of generators) {
      tile = g(pos, world);
      if (tile == null) {
        return;
      }
    }
    return tile;
  };
};

//prettier-ignore
const Reservoires: TileGenerator = layers(
  air,
  inSoil(
    mixedSoilRockMed,
    pastSoilDepth(1)(
      and(
        rotate(-Math.PI * 0.05)(
          roundedCheckerboard(12, 1.2)(rock)
        ),
        not(translateY(2)(
          rotate(-Math.PI * 0.05)(
            roundedCheckerboard(12, 1.2)(rock)
          )
        ))(rock),
      ),
    )
  )
);

const inOverhang = predicate((pos, world) => {
  const { noiseHeight } = world.generatorContext;
  const { x, y } = pos;
  // [-1, 1]
  const soilLevel = noiseHeight.simplex2(x / 15, y / 15);
  return soilLevel > map(y, 0, world.height, 4, -1);
});

const inSkySoil = (p: number) =>
  predicate((pos, world) => {
    const { noiseHeight } = world.generatorContext;
    const { x, y } = pos;

    // this is basically roundedCheckerboard with a slight rotation and a wavelength of 7.85
    // and then either
    // 1) the checkerboard is domain warped by perlin noise a bit, but the threshold decreases as a function of y
    // 2) roundedCheckerboard should accept a threshold scalar
    // 3) we build generic scalar comparator predicates - e.g.
    //    gt(roundedCheckerboard(12), 1.2)()
    //    gt(roundedCheckerboard(12), (pos, world) => 1.2 - noiseHeight)()
    //
    // we should try to avoid writing a generic expression tree; e.g. this would be horrible:
    //    and(
    //      gt(plus(roundedCheckerboard(12), heightPerlin2), 1.2),
    //      gt(y, minus(80, mult(soilLevel, 20)))
    // ranges in [-0.8, 2.8]
    const soilLevel = Math.sin(x / p + y / 12) ** 2 + Math.cos(y / p) ** 2 + noiseHeight.perlin2(x / 4, y / 26);

    return soilLevel > map(y, 0, world.height, 2.8, 0.2);
  });

const erode = (generator: TileGenerator): TileGenerator => {
  return (pos, world) => {
    const tile = generator(pos, world);
    if (tile == null) {
      return;
    }
    let dirName: Directions;
    for (dirName in DIRECTIONS) {
      const dir = DIRECTIONS[dirName];
      const testTile = generator(pos.clone().add(dir), world);
      if (testTile == null) {
        return;
      }
    }
    return tile;
  };
};

export const atEdge = (original: TileGenerator): TileCombiner => {
  return (...generators) => {
    const gen = layers(...generators);
    return and(original, not(erode(original))(gen));
  };
};

export const addEdge = (original: TileGenerator): TileCombiner => {
  return (...generators) => {
    const gen = layers(...generators);
    return layers(original, atEdge(original)(gen));
  };
};

//prettier-ignore
const SkySoil = layers(
  air,
  inSkySoil(2.5)(
    silt,
    inRockLevel(-0.8, -0.3)(rock),
    nearWaterMaxima(smallFountain),
  ),
  // addEdge(inSkySoil(2.5)(silt))(sand),
  // erode(
  //   inSkySoil(2.5)(silt)
  // )
  // addEdge(
  //   inSkySoil(2.5)(silt)
  // )(
  //   rock
  // )
);

export const TileGenerators = { Level0, Temperate, Desert, Rocky, Reservoires, SkySoil };
export type TileGeneratorName = keyof typeof TileGenerators;
