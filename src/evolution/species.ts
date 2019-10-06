import { Gene } from "./gene";

export interface Species {
  name: string;
  genes: Gene[];
  // cells: Cell[];
  freeMutationPoints: number;
  descendants: Species[];
  parent?: Species;
}

export function newBaseSpecies(name = "newBaseSpecies"): Species {
  return {
    name,
    genes: [],
    freeMutationPoints: 0,
    descendants: [],
  };
}

export interface Cell {
  genes: Gene[];
}
