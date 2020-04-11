import { Cell } from "./cell";
import { CellProperties } from "./cellProperties";
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
    initialState?: GeneInitialStateFn<S, K> | S,
    step?: GeneStepFn<S, K>,
    shouldStep: GeneShouldStepFn<S, K> = step != null ? alwaysStep : neverStep
  ) {
    const initialStateFn =
      typeof initialState === "function"
        ? (initialState as GeneInitialStateFn<S, K>)
        : () => ({ ...(initialState ?? ({} as S)) });
    const gene = new Gene<S, K>(blueprint, initialStateFn, step ?? (stepNoOP as GeneStepFn<S, K>), shouldStep);
    const { name } = gene.blueprint;
    const exists = AllGenesByName.has(name);
    if (exists) {
      console.error("A gene named", name, "already exists!");
    }
    AllGenesByName.set(gene.blueprint.name, (gene as unknown) as Gene);
    return gene;
  }
}

export const AllGenesByName: Map<string, Gene> = new Map();

export type RealizedProps<K extends string> = Record<K, number>;

export type PropBlueprint<K extends string> = Record<K, number | number[]>;

export interface GeneBlueprint<K extends string> {
  name: string;
  description: (props: RealizedProps<K>, sProps: Partial<CellProperties>) => React.ReactNode;
  levelCosts: number[];
  levelProps: PropBlueprint<K>;
  static?: CellPropertiesBlueprint;
  dynamic?(cell: Cell, properties: CellProperties): CellProperties;
  requirements?: Gene[];
}

export type CellPropertiesBlueprint = {
  [K in keyof CellProperties]?: CellProperties[K] | Array<CellProperties[K]>;
};

// export type GeneInitialStateFn<S, K extends string> = (instance: GeneInstance<Gene<S, K>>) => S;
export type GeneInitialStateFn<S, K extends string> = (gene: Gene<S, K>, props: RealizedProps<K>, cell: Cell) => S;

export type GeneStepFn<S, K extends string> = (dt: number, instance: GeneInstance<Gene<S, K>>) => S | void;

export type GeneShouldStepFn<S, K extends string> = (dt: number, instance: GeneInstance<Gene<S, K>>) => boolean;

const stepNoOP: GeneStepFn<any, any> = () => {};

export const alwaysStep: GeneShouldStepFn<any, any> = (dt) => {
  return true;
};

export const neverStep: GeneShouldStepFn<any, any> = (dt) => {
  return true;
};
