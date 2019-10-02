import { Gene } from "./gene";

export interface Species {
  id: string;
  displayName: string;
  cells: Cell[];
  freeMutationPoints: number;
  descendantsIds: string[]; // species ids
}

export interface Cell {
  genes: Gene[];
}
