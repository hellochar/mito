import mapRecord from "common/mapRecord";
import { clamp } from "math";
import { custom, identifier, serializable } from "serializr";
import uuid from "uuid";
import { Cell } from "../tile";
import { CellProperties } from "./cellProperties";
import { AllGenesByName, Gene } from "./gene";
import { GeneInstance } from "./geneInstance";

function serializeGeneIntoName(gene: Gene): string {
  return gene.blueprint.name;
}

function deserializeGeneFromName(name: string): Gene {
  return AllGenesByName.get(name)!;
}

export class RealizedGene<G extends Gene = Gene> {
  @serializable(custom(serializeGeneIntoName, deserializeGeneFromName))
  public gene: G;

  @serializable
  public level!: number;

  @serializable(identifier())
  public readonly uuid = uuid();

  public constructor(gene?: G, level?: number) {
    this.gene = gene!;
    if (level != null) {
      this.setLevel(level);
    }
  }

  getProperties() {
    const staticBlueprint = this.gene.blueprint.static || {};
    return mapRecord(staticBlueprint, (arr) => (Array.isArray(arr) ? arr[this.level] : arr)) as Partial<CellProperties>;
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

  toString() {
    return `RealizedGene(${this.gene.blueprint.name} ${this.level} [${this.uuid}])`;
  }
}
