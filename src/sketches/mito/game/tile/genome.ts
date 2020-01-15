import { Vector2 } from "three";
import { CellArgs } from "./cell";
import Chromosome from "./chromosome";

export interface CellInteraction {
  type: "give" | "take";
  resources: "water" | "sugar" | "water and sugar" | "water take sugar" | "sugar take water";
}

export class CellType {
  public args?: CellArgs;
  constructor(
    public name: string,
    public geneSlots: number,
    public chromosome: Chromosome,
    public interaction?: CellInteraction
  ) {
    if (chromosome.mergeStaticProperties().isDirectional) {
      this.args = {
        direction: new Vector2(0, -1),
      };
    }
  }
}

export default class Genome {
  constructor(public cellTypes: CellType[]) {}
}

export function describeCellInteraction({ resources, type }: CellInteraction) {
  return `${type} ${resources}`;
}
