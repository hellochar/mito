import capitalize from "../common/capitalize";
import { DNATuple, Gene } from "./gene";

export type TraitValue = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export type Traits = {
  /**
   * How fast the cell walks across this tile. Higher is faster.
   */
  walkSpeed: TraitValue;
  /**
   * How slower the cell consumes energy. Higher is lower energy usage
   * for the same behavior.
   */
  energyEfficiency: TraitValue;
  /**
   * How well this cell photosynthesizes. Higher is faster photosynthesis.
   */
  photosynthesis: TraitValue;
  /**
   * How well this cell absorbs nutrients and water from roots. Higher is
   * faster absorption rate.
   */
  rootAbsorption: TraitValue;
  /**
   * How many resources this cell can carry.
   */
  carryCapacity: TraitValue;
  /**
   * Whether this cell actively transports water. Higher means faster
   * water transport.
   */
  activeTransportWater: TraitValue;
  /**
   * Whether this cell actively transports sugar. Higher means faster
   * sugar transport.
   */
  activeTransportSugar: TraitValue;
  /**
   * How stable this cell is against gravity, weight, and wind forces.
   * Higher is more stable.
   */
  structuralStability: TraitValue;
  /**
   * How easily this cell passively diffuses water. Higher means faster diffusion.
   */
  diffuseWater: TraitValue;
  /**
   * How easily this cell passively diffuses sugar. Higher means faster diffusion.
   */
  diffuseSugar: TraitValue;
  /**
   * How quickly this cell builds.
   */
  buildTime: TraitValue;
  /**
   * How well this cell still works at high temperatures.
   */
  heatTolerant: TraitValue;
  /**
   * How well this cell still works at low temperatures.
   */
  coldTolerant: TraitValue;
  /**
   * How many resources a seed needs to be considered "matured". Lower is less resources.
   */
  fruitNeededResources: TraitValue;
  /**
   * How quickly a seed finishes growing. Higher is faster growth.
   */
  fruitGrowthSpeed: TraitValue;
  /**
   * How many mutation points a seed gives. Higher is more mutation.
   */
  fruitMutationPoints: TraitValue;
};

export type TraitDiff = Partial<Traits> & {
  [traitName: string]: TraitValue;
};

export type TraitType = keyof Traits;

export function emptyTraits(): Traits {
  return {
    carryCapacity: 0,
    energyEfficiency: 0,
    photosynthesis: 0,
    rootAbsorption: 0,
    structuralStability: 0,
    activeTransportSugar: 0,
    activeTransportWater: 0,
    walkSpeed: 0,
    diffuseWater: 0,
    diffuseSugar: 0,
    buildTime: 0,
    heatTolerant: 0,
    coldTolerant: 0,
    fruitGrowthSpeed: 0,
    fruitMutationPoints: 0,
    fruitNeededResources: 0,
  };
}

export function isInteresting(traits: Traits) {
  return TRAIT_TYPES.some((name) => traits[name] !== 0);
}

export const TRAIT_TYPES = Object.keys(emptyTraits()) as TraitType[];

export function displayName(trait: TraitType) {
  const splits = trait.split(/([A-Z])+/g);
  let displayName = capitalize(splits[0]);
  for (let i = 1; i < splits.length; i += 2) {
    displayName += " " + splits[i] + splits[i + 1];
  }
  return displayName;
}

// /**
//  * Mutates source.
//  * @param source source
//  * @param modifier modifier
//  */
// export function addTraits(source: TraitDiff, modifier: TraitDiff) {
//   for (const traitType in modifier) {
//     source[traitType] = clampToTraitValue((source[traitType] || 0) + modifier[traitType]!);
//   }
// }

export function clampToTraitValue(t: number): TraitValue {
  return (t < -3 ? -3 : t > 3 ? 3 : t) as TraitValue;
}

export function getTraits(genes: Gene[]): Traits {
  const traits: Traits = emptyTraits();
  for (const gene of genes) {
    const traitTypePlus = tupleToTrait(gene[0]);
    traits[traitTypePlus] += 1;

    const traitTypeMinus = tupleToTrait(gene[1]);
    traits[traitTypeMinus] -= 1;
    // const traitDiff = getTraitInfluence(gene);
    // addTraits(traits, traitDiff);
  }
  let val: TraitType;
  for (val in traits) {
    traits[val] = clampToTraitValue(traits[val]);
  }
  return traits;
}

const DNA_TUPLE_TO_TRAIT_TYPE: { [K in DNATuple]: TraitType } = {
  AA: "walkSpeed",
  AC: "energyEfficiency",
  AG: "photosynthesis",
  AT: "rootAbsorption",
  CA: "carryCapacity",
  CC: "activeTransportSugar",
  CG: "activeTransportWater",
  CT: "structuralStability",
  GA: "diffuseSugar",
  GC: "diffuseWater",
  GG: "buildTime",
  GT: "heatTolerant",
  TA: "coldTolerant",
  TC: "fruitGrowthSpeed",
  TG: "fruitMutationPoints",
  TT: "fruitNeededResources",
};

const TRAIT_TYPE_TO_DNA_TUPLE = {} as { [K in TraitType]: DNATuple };
for (const [tuple, type] of Object.entries(DNA_TUPLE_TO_TRAIT_TYPE)) {
  TRAIT_TYPE_TO_DNA_TUPLE[type] = tuple as DNATuple;
}

export function tupleToTrait(dnaTuple: DNATuple) {
  return DNA_TUPLE_TO_TRAIT_TYPE[dnaTuple];
}

export function traitToTuple(trait: TraitType) {
  return TRAIT_TYPE_TO_DNA_TUPLE[trait];
}

/**
 * Use to easily modify a base value by a trait amount.
 *
 * Exponent > 1 means base goes up with trait.
 * Exponent < 1 means base goes down with trait.
 */
export function traitMod(val: TraitValue, base: number, exponent: number) {
  return base * Math.pow(exponent, val);
}
