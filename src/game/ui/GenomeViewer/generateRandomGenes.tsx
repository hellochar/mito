import { RealizedGene } from "core/cell";
import { Species } from "core/species";
import { randInt } from "math";
import shuffle from "math/shuffle";
import { GeneDiffuseWater } from "std/genes/GeneDiffuseWater";
import { GenePipes } from "std/genes/GenePipes";
import { GeneTransport } from "std/genes/GeneTransport";
import { AllGenesByName } from "../../../core/cell/gene";

export function generateRandomGenes(numGenes = 3) {
  // disallow same gene to spawn in one drawing
  const AllGenes = Array.from(AllGenesByName.values());
  shuffle(AllGenes);
  const genes: RealizedGene[] = AllGenes.slice(0, numGenes).map((g) =>
    g.level(randInt(0, g.blueprint.levelCosts.length - 1))
  );
  return genes;
}

export function populateGeneOptions(species: Species) {
  const hasTransport = species.genome.cellTypes.some((type) => type.chromosome.has(GeneTransport));
  const hasPipes = species.genome.cellTypes.some((type) => type.chromosome.has(GenePipes));
  const hasDiffuseWater = species.genome.cellTypes.some((type) => type.chromosome.has(GeneDiffuseWater));

  if (!hasTransport && !hasPipes && !hasDiffuseWater) {
    return [GeneTransport.level(2), GenePipes.level(2), GeneDiffuseWater.level(0)];
  } else {
    return generateRandomGenes(3);
  }
}
