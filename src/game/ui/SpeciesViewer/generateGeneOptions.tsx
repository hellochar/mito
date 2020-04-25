import { RealizedGene } from "core/cell";
import { Species } from "core/species";
import { randInt } from "math";
import shuffle from "math/shuffle";
import { GeneDiffuseWater } from "std/genes/GeneDiffuseWater";
import { GenePipes } from "std/genes/GenePipes";
import { GeneTransport } from "std/genes/GeneTransport";
import { AllGenesByName } from "../../../core/cell/gene";

export function generateGeneOptions(species: Species, isFirstChoice: boolean): RealizedGene[] {
  if (isFirstChoice) {
    return [GeneTransport.level(0), GenePipes.level(0), GeneDiffuseWater.level(0)];
  }

  // disallow same gene to spawn in one drawing
  const allGenes = Array.from(AllGenesByName.values());
  shuffle(allGenes);
  const allProviderGenes = allGenes.filter((gene) => gene.blueprint.levelCosts[0] < 0);
  const allConsumerGenes = allGenes.filter((gene) => gene.blueprint.levelCosts[0] >= 0);
  // const genes: RealizedGene[] = allGenes.slice(0, numGenes).map((g) => g.level(randInt(0, g.numLevels - 1)));
  // return genes;
  const genes = [
    ...allConsumerGenes.slice(0, 2).map((g) => g.level(randInt(0, g.numLevels - 1))),
    allProviderGenes[0].level(randInt(0, allProviderGenes[0].numLevels - 1)),
  ];
  return genes;
}
