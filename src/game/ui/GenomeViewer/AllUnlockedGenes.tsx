import React from "react";
import { AllGenesByName } from "../../../core/cell/gene";
import Genome from "../../../core/cell/genome";
export function AllUnlockedGenes({ genome }: { genome: Genome }) {
  const genesUnlocked = new Set(genome.cellTypes.flatMap((c) => c.chromosome.genes.map((g) => g.gene)));
  return (
    <div>
      {Array.from(AllGenesByName.entries()).map(([name, gene]) =>
        genesUnlocked.has(gene) ? (
          <div>
            <b>{name}</b>
          </div>
        ) : (
          <div>{name}</div>
        )
      )}
    </div>
  );
}
