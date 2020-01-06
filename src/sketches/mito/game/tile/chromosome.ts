import mapRecord from "common/mapRecord";
import plantNames from "common/plantNames";
import { clamp, sampleArray } from "math";
import { Cell } from ".";
import { Steppable } from "../entity";

const defaultProperties: GeneStaticProperties = {
  isObstacle: false,
  inventoryCapacity: 0,
  diffusionRate: 12,
};

export default class Chromosome {
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
      Object.assign(p, g.gene.blueprint.static);
    }
    this.staticProperties = p;
  }

  getStaticProperties(): GeneStaticProperties {
    return this.staticProperties;
  }

  has(gene: Gene): boolean {
    return this.genes.find((r) => r.gene === gene) != null;
  }

  geneSlotsUsed() {
    return this.genes.map((g) => g.getCost()).reduce((a, b) => a + b, 0);
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

export class RealizedGene<G extends Gene = Gene> {
  public constructor(public gene: G, public level: number) {}
  public getProps() {
    return mapRecord(this.gene.blueprint.levelProps, (val) => val[this.level]);
  }

  public getCost() {
    return this.gene.blueprint.levelCosts[this.level];
  }

  changeLevel(newLevel: number): void {
    this.level = clamp(newLevel, 0, 4);
  }

  public newInstance(cell: Cell): GeneInstance<G> {
    return new GeneInstance(this.gene, this.getProps(), cell);
  }
}

export const AllGenes: Map<string, Gene> = new Map();

export type PropBlueprint<K extends string> = Record<K, number[]>;

export type RealizedProps<K extends string> = Record<K, number>;

// type GeneInstanceFor<G extends Gene> = ReturnType<ReturnType<G['level']>["newInstance"]>;
// function doSomethingWithGeneSoilAbsorb(instance: GeneInstanceFor<GeneSoilAbsorb>)
type GeneState<G extends Gene> = G extends Gene<infer S, any> ? S : never;
type GenePropNames<G extends Gene> = G extends Gene<any, infer K> ? K : never;
export class GeneInstance<G extends Gene, S = GeneState<G>, K extends string = GenePropNames<G>> implements Steppable {
  public dtSinceLastStepped = 0;
  public state: S;
  public get blueprint() {
    return this.gene.blueprint;
  }
  constructor(public gene: G, public props: RealizedProps<K>, public cell: Cell) {
    this.state = gene.initialStateFn(gene, props, cell);
  }

  public isType<S, K extends string>(gene: Gene<S, K>): this is GeneInstance<Gene<S, K>> {
    return this.gene === gene;
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
  description: (props: RealizedProps<K>) => React.ReactNode;
  levelCosts: number[];
  levelProps: PropBlueprint<K>;
  static?: GeneStaticProperties;
  requirements?: Gene[];
}

// export type GeneInitialStateFn<S, K extends string> = (instance: GeneInstance<Gene<S, K>>) => S;
export type GeneInitialStateFn<S, K extends string> = (gene: Gene<S, K>, props: RealizedProps<K>, cell: Cell) => S;

export type GeneStepFn<S, K extends string> = (dt: number, instance: GeneInstance<Gene<S, K>>) => S | void;

export type GeneShouldStepFn<S, K extends string> = (dt: number, instance: GeneInstance<Gene<S, K>>) => boolean;

const defaultShouldStepFn: GeneShouldStepFn<any, any> = (dt) => {
  return true;
};
