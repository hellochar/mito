import { list, object, serializable } from "serializr";
import { GeneInventory, GeneLiving } from "std/genes";
import { Cell } from "../tile";
import { defaultProperties, Gene } from "./gene";
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
   * Booleans overwrite each other; numbers add together.
   */
  public mergeStaticProperties() {
    const finalProps = { ...defaultProperties };
    for (const g of this.genes) {
      // TODO beware of clobbering
      for (const [k, v] of Object.entries(g.getStaticProperties())) {
        if (typeof v === "boolean") {
          finalProps[k] = v;
        } else if (typeof v === "number") {
          finalProps[k] = (finalProps[k] as number) + v;
        }
      }
      // Object.assign(finalProps, g.getStaticProperties());
    }
    return finalProps;
  }

  newGeneInstances(cell: Cell) {
    return this.genes.map((g) => g.newInstance(cell));
  }

  has(gene: Gene): boolean {
    return this.genes.find((r) => r.gene === gene) != null;
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
