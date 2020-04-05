import plantNames from "common/plantNames";
import { sampleArray } from "math";
import { CELL_BUILD_TIME } from "../constants";
import { Cell } from "./cell";
import { GeneInstance } from "./geneInstance";
import { RealizedGene } from "./realizedGene";

export class Gene<S = any, K extends string = any> {
  private constructor(
    public readonly blueprint: GeneBlueprint<K>,
    public readonly initialStateFn: GeneInitialStateFn<S, K>,
    public readonly stepFn: GeneStepFn<S, K>,
    public readonly shouldStepFn: GeneShouldStepFn<S, K>
  ) {}

  level(level: number): RealizedGene<Gene<S, K>> {
    return new RealizedGene(this, level);
  }

  static make<S = any, K extends string = string>(
    blueprint: GeneBlueprint<K>,
    initialState: GeneInitialStateFn<S, K> | S,
    step: GeneStepFn<S, K>,
    shouldStep: GeneShouldStepFn<S, K> = defaultShouldStepFn
  ) {
    const initialStateFn =
      typeof initialState === "function" ? (initialState as GeneInitialStateFn<S, K>) : () => ({ ...initialState });
    const gene = new Gene(blueprint, initialStateFn, step, shouldStep);
    const { name } = gene.blueprint;
    const exists = AllGenesByName.has(name);
    if (exists) {
      const newName = name + " " + sampleArray(plantNames);
      console.warn("A gene named", name, "already exists! Renaming this one to", newName);
      gene.blueprint.name = newName;
    }
    AllGenesByName.set(gene.blueprint.name, (gene as unknown) as Gene);
    return gene;
  }
}

export const AllGenesByName: Map<string, Gene> = new Map();

export const defaultProperties: GeneStaticProperties = {
  cantFreeze: false,
  isReproductive: false,
  isObstacle: false,
  inventoryCapacity: 0,
  costSugar: 1,
  costWater: 1,
  diffusionWater: 0,
  diffusionSugar: 0,
  timeToBuild: CELL_BUILD_TIME,
  isDirectional: false,
};

export type GeneStaticProperties = {
  cantFreeze: boolean;
  isReproductive: boolean;
  isDirectional: boolean;
  isObstacle: boolean;
  inventoryCapacity: number;
  costSugar: number;
  costWater: number;
  diffusionWater: number;
  diffusionSugar: number;
  timeToBuild: number;
  [k: string]: number | boolean;
};

export type RealizedProps<K extends string> = Record<K, number>;

export type PropBlueprint<K extends string> = Record<K, number | number[]>;

export interface GeneBlueprint<K extends string> {
  name: string;
  description: (props: RealizedProps<K>, sProps: Partial<GeneStaticProperties>) => React.ReactNode;
  levelCosts: number[];
  levelProps: PropBlueprint<K>;
  static?: GeneStaticPropertiesBlueprint;
  requirements?: Gene[];
}

export type GeneStaticPropertiesBlueprint = {
  [K in keyof GeneStaticProperties]?: GeneStaticProperties[K] | Array<GeneStaticProperties[K]>;
};

// export type GeneInitialStateFn<S, K extends string> = (instance: GeneInstance<Gene<S, K>>) => S;
export type GeneInitialStateFn<S, K extends string> = (gene: Gene<S, K>, props: RealizedProps<K>, cell: Cell) => S;

export type GeneStepFn<S, K extends string> = (dt: number, instance: GeneInstance<Gene<S, K>>) => S | void;

export type GeneShouldStepFn<S, K extends string> = (dt: number, instance: GeneInstance<Gene<S, K>>) => boolean;

export const defaultShouldStepFn: GeneShouldStepFn<any, any> = (dt) => {
  return true;
};
