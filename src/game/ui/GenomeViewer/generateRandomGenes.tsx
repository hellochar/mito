import { randInt } from "math";
import { arrayRange } from "math/arrays";
import { AllGenesByName } from "../../../core/cell/gene";

export function generateRandomGenes(numGenes = 20) {
  const AllGenes = Array.from(AllGenesByName.values());
  return arrayRange(numGenes).map(() => {
    const randomGene = AllGenes[randInt(0, AllGenes.length - 1)];
    return randomGene.level(randInt(0, randomGene.blueprint.levelCosts.length - 1));
  });
}
