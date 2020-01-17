import { createSimpleSchema, identifier, list, object, primitive, reference } from "serializr";
import Genome from "sketches/mito/game/tile/genome";
import { standardGenome } from "sketches/mito/game/tile/standardGenome";
import uuid from "uuid";
import { Gene } from "./gene";

export interface Species {
  genome: Genome;
  id: string;
  name: string;
  genes: Gene[];
  // cells: Cell[];
  freeMutationPoints: number;
  totalMutationPoints: number;
  descendants: Species[];
  parent?: Species;
}

export const SpeciesSchema = createSimpleSchema<Species>({
  id: identifier(),
  name: primitive(),
  genes: list(list(primitive())),
  freeMutationPoints: primitive(),
  totalMutationPoints: primitive(),
  // descendants: reference(SpeciesSchema),
  // parent: reference(SpeciesSchema),
});
SpeciesSchema.props.descendants = list(object(SpeciesSchema));
SpeciesSchema.props.parent = reference(SpeciesSchema);

export function newBaseSpecies(name = "plantum originus"): Species {
  return {
    id: uuid(),
    genome: standardGenome,
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
