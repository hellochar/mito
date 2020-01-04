import plantNames from "common/plantNames";
import { sampleArray } from "math";
import { Cell } from ".";
import { Steppable } from "../entity";

const defaultProperties: GeneStaticProperties = {
  isObstacle: false,
  inventoryCapacity: 0,
  diffusionRate: 12,
};

export default class Genome {
  public genes: Gene<any>[];
  private staticProperties: GeneStaticProperties = { ...defaultProperties };
  constructor(...genes: Gene<any>[]) {
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

export class Gene<S> {
  private constructor(
    public readonly blueprint: GeneBlueprint,
    public readonly initialStateFn: GeneInitialStateFn<S>,
    public readonly stepFn: GeneStepFn<S>,
    public readonly shouldStepFn: GeneShouldStepFn<S>
  ) {}

  public newInstance(cell: Cell): GeneInstance<S> {
    return new GeneInstance(this, cell);
  }

  static make<S>(
    blueprint: GeneBlueprint,
    initialState: GeneInitialStateFn<S>,
    step: GeneStepFn<S>,
    shouldStep: GeneShouldStepFn<S> = defaultShouldStepFn
  ) {
    const gene = new Gene(blueprint, initialState, step, shouldStep);
    const { name } = gene.blueprint;
    const exists = AllGenes[name] != null;
    if (exists) {
      const newName = name + " " + sampleArray(plantNames);
      console.warn("A gene named", name, "already exists! Renaming this one to", newName);
      gene.blueprint.name = newName;
    }
    AllGenes[gene.blueprint.name] = gene;
  }
}

export const AllGenes: Record<string, Gene<any>> = {};

export class GeneInstance<S = any> implements Steppable {
  public dtSinceLastStepped = 0;
  public state: S;
  constructor(public gene: Gene<S>, public cell: Cell) {
    this.state = gene.initialStateFn(gene.blueprint, cell);
  }

  shouldStep(dt: number) {
    return this.gene.shouldStepFn(dt, this.state, this.gene.blueprint, this.cell);
  }

  step(dt: number) {
    this.state = this.gene.stepFn(dt, this.state, this.gene.blueprint, this.cell);
  }
}

export interface GeneBlueprint {
  name: string;
  levelCosts: number[];
  levelProps: Record<string, number[]>;
  static?: GeneStaticProperties;
  requirements?: Gene<any>[];
}

export type GeneInitialStateFn<S> = (blueprint: GeneBlueprint, cell: Cell) => S;

export type GeneStepFn<S> = (dt: number, state: S, blueprint: GeneBlueprint, cell: Cell) => S;

export type GeneShouldStepFn<S> = (dt: number, state: S, blueprint: GeneBlueprint, cell: Cell) => boolean;

const defaultShouldStepFn: GeneShouldStepFn<any> = (dt) => {
  return true;
};
