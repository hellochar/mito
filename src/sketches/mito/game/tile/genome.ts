import { Constructor } from "sketches/mito/constructor";
import Chromosome from "./chromosome";
import { Tile } from "./tile";

export interface CellInteraction {
  type: "give" | "take";
  resources: "water" | "sugar" | "water and sugar" | "water take sugar" | "sugar take water";
}

export class CellType {
  constructor(
    public name: string,
    public geneSlots: number,
    public chromosome: Chromosome,
    public c: Constructor<Tile>,
    public interaction?: CellInteraction
  ) {}
}

export default class Genome {
  constructor(public cellTypes: CellType[]) {}
}

export function describeCellInteraction({ resources, type }: CellInteraction) {
  return `${type} ${resources}`;
}
