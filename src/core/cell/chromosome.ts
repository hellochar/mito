import { list, object, serializable } from "serializr";
import { GeneInventory, GeneLiving } from "std/genes";
import { Cell } from "../tile";
import { CellProperties, defaultCellProperties } from "./cellProperties";
import { Gene } from "./gene";
import { RealizedGene } from "./realizedGene";

export default class Chromosome {
  static basic(): Chromosome {
    return new Chromosome(GeneLiving.level(2), GeneInventory.level(2));
  }

  @serializable(list(object(RealizedGene)))
  public genes: RealizedGene[];

  constructor(...genes: RealizedGene[]) {
    this.genes = genes;
  }

  /**
   * Values overwrite each other by default; numbers add together.
   */
  public getProperties() {
    const properties = defaultCellProperties();
    for (const g of this.genes) {
      // TODO beware of clobbering
      for (const [k, v] of Object.entries(g.getProperties())) {
        if (k === "tempo") {
          properties[k] *= v as number;
        } else if (typeof v === "number") {
          properties[k] = (properties[k] as number) + v;
        } else if (v != null) {
          properties[k] = v;
        }
      }
    }
    return properties;
  }

  public getDynamicProperties(cell: Cell): CellProperties {
    let properties = this.getProperties();
    for (const g of this.genes) {
      properties = g.getDynamicProperties(cell, properties) ?? properties;
    }
    return properties;
  }

  newGeneInstances(cell: Cell) {
    return this.genes.map((g) => g.newInstance(cell));
  }

  has(gene: Gene): boolean {
    return this.genes.find((r) => r.gene === gene) != null;
  }

  isEmpty() {
    return this.genes.length === 0;
  }

  geneSlotsUsed() {
    return this.genes
      .map((g) => g.getCost())
      .filter((c) => c >= 0)
      .reduce((a, b) => a + b, 0);
  }

  geneSlotsAdded() {
    return (
      this.genes
        .map((g) => g.getCost())
        .filter((c) => c < 0)
        .reduce((a, b) => a + b, 0) * -1
    );
  }

  geneSlotsNet(): number {
    return this.geneSlotsAdded() - this.geneSlotsUsed();
  }
}
