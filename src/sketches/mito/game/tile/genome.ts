import { Constructor } from "sketches/mito/constructor";
import Chromosome from "./chromosome";
import { Tile } from "./tile";

export class CellType {
  constructor(
    public name: string,
    public geneSlots: number,
    public chromosome: Chromosome,
    public c: Constructor<Tile>
  ) {}
}

export default class Genome {
  constructor(public cellTypes: CellType[]) {}
}
