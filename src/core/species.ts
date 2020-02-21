import Genome from "core/cell/genome";
import { createSimpleSchema, identifier, list, object, primitive, reference } from "serializr";
import { tutorialGenome } from "std/genomes/tutorialGenome";
import uuid from "uuid";

export interface Species {
  genome: Genome;
  id: string;
  name: string;
  freeMutationPoints: number;
  totalMutationPoints: number;
  descendants: Species[];
  parent?: Species;
}

export const SpeciesSchema = createSimpleSchema<Species>({
  // TODO fill in
  // genome:
  id: identifier(),
  name: primitive(),
  freeMutationPoints: primitive(),
  totalMutationPoints: primitive(),
});
SpeciesSchema.props.descendants = list(object(SpeciesSchema));
SpeciesSchema.props.parent = reference(SpeciesSchema);

export function newBaseSpecies(name = "plantum originus"): Species {
  return {
    id: uuid(),
    genome: tutorialGenome,
    name,
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
