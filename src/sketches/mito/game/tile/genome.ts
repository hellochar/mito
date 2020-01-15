import { Constructor } from "sketches/mito/constructor";
import { Cell } from "./cell";
import Chromosome from "./chromosome";

export interface CellInteraction {
  type: "give" | "take";
  resources: "water" | "sugar" | "water and sugar" | "water take sugar" | "sugar take water";
}

export class CellType {
  constructor(
    public name: string,
    public geneSlots: number,
    public chromosome: Chromosome,
    public c: Constructor<Cell>,
    public interaction?: CellInteraction
  ) {}
}

export default class Genome {
  constructor(public cellTypes: CellType[]) {}
}

export function describeCellInteraction({ resources, type }: CellInteraction) {
  return `${type} ${resources}`;
}
