import uuid from "uuid";
import { Gene } from "./gene";

export interface Species {
  id: string;
  name: string;
  genes: Gene[];
  // cells: Cell[];
  freeMutationPoints: number;
  totalMutationPoints: number;
  descendants: Species[];
  parent?: Species;
}

export function newBaseSpecies(name = "newBaseSpecies"): Species {
  return {
    id: uuid(),
    name,
    // genes: [mutateRandomNewGene(), mutateRandomNewGene(), mutateRandomNewGene()],
    genes: [],
    freeMutationPoints: 0,
    totalMutationPoints: 0,
    descendants: [],
  };
}

export function lineage(species: Species): Species[] {
  const arr = [];
  arr.push(species);
  for (const s of species.descendants) {
    arr.push(...lineage(s));
  }
  return arr;
}

export interface Cell {
  genes: Gene[];
}
