export interface Species {
  id: string;
  displayName: string;
  cells: Cell[];
  freeMutationPoints: number;
  descendantsIds: string[]; // species ids
}

export interface Cell {
  genes: Gene[];
}

export function getTraits(genes: Gene[]): Traits {
  const traits: Traits = emptyTraits();
  for (const gene of genes) {
    const traitDiff = getTraitInfluence(gene);
    addTraits(traits, traitDiff);
  }
  return traits;
}

function getTraitInfluence(gene: Gene): TraitDiff {
  const traitDiff: TraitDiff = {};
  const traitTypePlus = dnaPairToTraitType(gene[0]);
  if (traitTypePlus != null) {
    traitDiff[traitTypePlus] = 1;
  }

  const traitTypeMinus = dnaPairToTraitType(gene[0]);
  if (traitTypeMinus != null) {
    traitDiff[traitTypeMinus] = -1;
  }
  return traitDiff;
}

function dnaPairToTraitType(dnaTuple: DNATuple): TraitType | undefined {
  switch (dnaTuple) {
    case "AA": return "walkSpeed";
    case "AC": return "energyEfficiency";
    case "AG": return "photosynthesis";
    case "AT": return "rootAbsorption";
    case "CA": return "carryCapacity";
    case "CC": return "activeTransportSugar";
    case "CG": return "activeTransportWater";
    case "CT": return "structuralStability";
    default: return undefined;
  }
}

export type DNATuple =
"AA" | "AC" | "AG" | "AT" |
"CA" | "CC" | "CG" | "CT" |
"GA" | "GC" | "GG" | "GT" |
"TA" | "TC" | "TG" | "TT";

export type DNA = "A" | "C" | "G" | "T";

export type Gene = [DNATuple, DNATuple];

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
};

export type TraitType = keyof Traits;

function emptyTraits(): Traits {
  return {
    carryCapacity: 0,
    energyEfficiency: 0,
    photosynthesis: 0,
    rootAbsorption: 0,
    structuralStability: 0,
    activeTransportSugar: 0,
    activeTransportWater: 0,
    walkSpeed: 0,
  };
}

/**
 * Mutates source.
 * @param source source
 * @param modifier modifier
 */
function addTraits(source: TraitDiff, modifier: TraitDiff) {
  for (const traitType in modifier) {
    source[traitType] = clampToTraitValue(
      (source[traitType] || 0) + modifier[traitType]!
    );
  }
}

function clampToTraitValue(t: number): TraitValue {
  return (t < -3 ? -3 : t > 3 ? 3 : t) as TraitValue;
}

type TraitDiff = Partial<Traits> & {
  [traitName: string]: TraitValue;
}
