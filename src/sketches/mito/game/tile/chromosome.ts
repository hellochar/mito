import mapRecord from "common/mapRecord";
import plantNames from "common/plantNames";
import { sampleArray } from "math";
import { Cell } from ".";
import { Steppable } from "../entity";

const defaultProperties: GeneStaticProperties = {
  isObstacle: false,
  inventoryCapacity: 0,
  diffusionRate: 12,
};

export default class Chromosome {
  has(gene: Gene): boolean {
    return this.genes.find((r) => r.gene === gene) != null;
  }

  public genes: RealizedGene[];
  private staticProperties: GeneStaticProperties = { ...defaultProperties };
  constructor(...genes: RealizedGene[]) {
    this.genes = genes;
    this.recomputeStaticProperties();
  }

  newGeneInstances(cell: Cell) {
    return this.genes.map((g) => g.newInstance(cell));
  }

  recomputeStaticProperties() {
    const p = { ...defaultProperties };
    for (const g of this.genes) {
      // TODO beware of clobbering
      Object.assign(p, g);
    }
    this.staticProperties = p;
  }

  getStaticProperties(): GeneStaticProperties {
    return this.staticProperties;
  }
}

export interface GeneStaticProperties {
  isObstacle: boolean;
  inventoryCapacity: number;
  diffusionRate: number;
}

export class Gene<S = any, K extends string = any> {
  private constructor(
    public readonly blueprint: GeneBlueprint<K>,
    public readonly initialStateFn: GeneInitialStateFn<S, K>,
    public readonly stepFn: GeneStepFn<S, K>,
    public readonly shouldStepFn: GeneShouldStepFn<S, K>
  ) {}

  level(level: number) {
    return new RealizedGene(this, level);
  }

  static make<S = any, K extends string = string>(
    blueprint: GeneBlueprint<K>,
    initialState: GeneInitialStateFn<S, K> | S,
    step: GeneStepFn<S, K>,
    shouldStep: GeneShouldStepFn<S, K> = defaultShouldStepFn
  ) {
    const initialStateFn =
      typeof initialState === "function" ? (initialState as GeneInitialStateFn<S, K>) : () => initialState;
    const gene = new Gene(blueprint, initialStateFn, step, shouldStep);
    const { name } = gene.blueprint;
    const exists = AllGenes.has(name);
    if (exists) {
      const newName = name + " " + sampleArray(plantNames);
      console.warn("A gene named", name, "already exists! Renaming this one to", newName);
      gene.blueprint.name = newName;
    }
    AllGenes.set(gene.blueprint.name, (gene as unknown) as Gene);
    return gene;
  }
}

export class RealizedGene<S = any, K extends string = any> {
  public constructor(public gene: Gene<S, K>, public level: number) {}

  public newInstance(cell: Cell): GeneInstance<S, K> {
    return new GeneInstance(this.gene, this.level, cell);
  }
}

export const AllGenes: Map<string, Gene> = new Map();

export type PType<K extends string> = Record<K, number[]>;

export type RealizedProps<K extends string> = Record<K, number>;

export class GeneInstance<S = any, K extends string = string> implements Steppable {
  public dtSinceLastStepped = 0;
  public state: S;
  public props: RealizedProps<K>;
  public get blueprint() {
    return this.gene.blueprint;
  }
  constructor(public gene: Gene<S, K>, public level: number, public cell: Cell) {
    this.props = mapRecord(gene.blueprint.levelProps, (val) => val[level]);
    this.state = gene.initialStateFn(this);
  }

  shouldStep(dt: number) {
    return this.gene.shouldStepFn(dt, this);
  }

  step(dt: number) {
    const maybeNewState = this.gene.stepFn(dt, this);
    if (maybeNewState !== undefined) {
      this.state = maybeNewState;
    }
  }
}

export interface GeneBlueprint<K extends string> {
  name: string;
  levelCosts: number[];
  levelProps: PType<K>;
  static?: GeneStaticProperties;
  requirements?: Gene[];
}

export type GeneInitialStateFn<S, K extends string> = (instance: GeneInstance<S, K>) => S;

export type GeneStepFn<S, K extends string> = (dt: number, instance: GeneInstance<S, K>) => S | void;

export type GeneShouldStepFn<S, K extends string> = (dt: number, nstance: GeneInstance<S, K>) => boolean;

const defaultShouldStepFn: GeneShouldStepFn<any, any> = (dt) => {
  return true;
};
