import { list, object, serializable } from "serializr";
import { Cell } from "../tile";
import { defaultCellProperties } from "./cellProperties";
import { Gene } from "./gene";
import { RealizedGene } from "./realizedGene";

export default class Chromosome {
  @serializable(list(object(RealizedGene)))
  public genes: RealizedGene[];

  constructor(...genes: RealizedGene[]) {
    this.genes = genes;
  }

  /**
   * Values overwrite each other by default; numbers add together.
   */
  public computeStaticProperties() {
    const properties = defaultCellProperties();
    for (const g of this.genes) {
      // TODO beware of clobbering
      for (const [k, v] of Object.entries(g.getStaticProperties())) {
        if (k === "tempo") {
          properties[k] *= v as number;
        } else if (typeof v === "number") {
          properties[k] = (properties[k] as number) + v;
        } else if (v != null) {
          properties[k] = v;
        }
      }
    }
    properties.timeToBuild = Math.max(properties.timeToBuild, 0);
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
