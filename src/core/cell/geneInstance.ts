import { Steppable } from "../entity";
import { Cell } from "../tile";
import { Gene, RealizedProps } from "./gene";

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

  shouldStep(dt: number): boolean {
    return this.gene.shouldStepFn(dt, this);
  }

  step(dt: number) {
    const maybeNewState = this.gene.stepFn(dt, this);
    if (maybeNewState !== undefined) {
      this.state = maybeNewState;
    }
  }

  earnMP(cell: Cell, mpEarned: number) {
    cell.world.earnMP(cell, mpEarned);
  }
}
