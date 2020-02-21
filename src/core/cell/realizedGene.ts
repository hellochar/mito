import mapRecord from "common/mapRecord";
import { clamp } from "math";
import { Cell } from "../tile";
import { Gene, GeneStaticProperties } from "./gene";
import { GeneInstance } from "./geneInstance";

export class RealizedGene<G extends Gene = Gene> {
  public constructor(public gene: G, public level: number) {
    this.setLevel(level);
  }

  getStaticProperties() {
    const staticBlueprint = this.gene.blueprint.static || {};
    return mapRecord(staticBlueprint, (arr) => (Array.isArray(arr) ? arr[this.level] : arr)) as Partial<
      GeneStaticProperties
    >;
  }

  public getProps() {
    return mapRecord(this.gene.blueprint.levelProps, (val) => (typeof val === "number" ? val : val[this.level]));
  }

  public getCost() {
    return this.gene.blueprint.levelCosts[this.level];
  }

  setLevel(newLevel: number): void {
    this.level = clamp(newLevel, 0, this.gene.blueprint.levelCosts.length);
  }

  public newInstance(cell: Cell): GeneInstance<G> {
    return new GeneInstance(this.gene, this.getProps(), cell);
  }
}
