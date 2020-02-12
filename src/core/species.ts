import Genome from "core/cell/genome";
import { createSimpleSchema, identifier, list, object, primitive, reference } from "serializr";
import { tutorialGenome } from "sketches/mito/game/tile/tutorialGenome";
import uuid from "uuid";

export interface Species {
  genome: Genome;
  id: string;
  name: string;
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
    genome: tutorialGenome,
    name,
    // genes: [mutateRandomNewGene(), mutateRandomNewGene(), mutateRandomNewGene()],
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
