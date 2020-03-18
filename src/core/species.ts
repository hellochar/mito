import Genome from "core/cell/genome";
import { createSimpleSchema, identifier, list, object, primitive, reference } from "serializr";
import { tutorialGenome } from "std/genomes/tutorialGenome";
import uuid from "uuid";
import { RealizedGene } from "./cell";

export interface Species {
  genome: Genome;
  id: string;
  name: string;
  freeMutationPoints: number;
  totalMutationPoints: number;
  descendants: Species[];
  parent?: Species;
  geneOptions: RealizedGene[];
}

export const SpeciesSchema = createSimpleSchema<Species>({
  // TODO fill in
  genome: object(Genome),
  id: identifier(),
  name: primitive(),
  freeMutationPoints: primitive(),
  totalMutationPoints: primitive(),
  geneOptions: list(object(RealizedGene)),
});
// we can't self-reference SpeciesSchema in its instantiation; set it after
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
    geneOptions: [],
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
