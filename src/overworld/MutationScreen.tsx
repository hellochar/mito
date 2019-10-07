import React from "react";

import { Species } from "../evolution/species";

import "./MutationScreen.scss";
import SpeciesDetails from "../evolution/SpeciesDetails";
import { PurpleButton } from "../evolution/PurpleButton";
import { mutateRandomNewGene, mutatePosition, mutateSwapDNA } from "../evolution/mutation";
import { Gene } from "../evolution/gene";
import Character from "../common/Character";
import classNames from "classnames";

function MutationScreen({ species }: { species: Species }) {
  const [pool, setPool] = React.useState(species.freeMutationPoints);

  const [newSpecies, setNewSpecies] = React.useState<Species>({
    descendants: [],
    freeMutationPoints: 0,
    genes: [...species.genes],
    name: "New species",
    parent: species,
  });

  type ClickModeSwap = {
    type: "swap";
    p1?: { gene: Gene; position: number; };
  }
  type ClickModeReroll = {
    type: "reroll";
  }
  type ClickMode = ClickModeSwap | ClickModeReroll | undefined;
  const [clickMode, setClickMode] = React.useState<ClickMode>();

  const newGeneCost = newSpecies.genes.length + 1;

  const handleNewGene = () => {
    setPool(p => p - newGeneCost);
    setNewSpecies((species) => ({
      ...species,
      genes: [...species.genes, mutateRandomNewGene()],
    }));
  };

  const startSwapClickMode = () => {
    setClickMode({ type: "swap" });
  };

  const startRerollClickMode = () => {
    setClickMode({ type: "reroll" });
  };

  function reroll(gene: Gene, position: number) {
    setPool(p => p - 1);
    setNewSpecies((species) => {
      const geneIndex = species.genes.indexOf(gene);
      const newGene = mutatePosition(gene, position);
      const newGenes = [...species.genes.slice(0, geneIndex), newGene, ...species.genes.slice(geneIndex + 1)];
      return {
        ...species,
        genes: newGenes,
      };
    });
    setClickMode(undefined);
  }

  function swap(gene1: Gene, position1: number, gene2: Gene, position2: number) {
    setPool(p => p - 2);
    setNewSpecies((species) => {
      const geneIndex1 = species.genes.indexOf(gene1);
      const geneIndex2 = species.genes.indexOf(gene2);

      const newGenes = [...species.genes];

      const [newGene1, newGene2] = mutateSwapDNA(gene1, position1, gene2, position2);
      newGenes[geneIndex1] = newGene1;
      newGenes[geneIndex2] = newGene2;

      return {
        ...species,
        genes: newGenes
      };
    });
  }

  const handleGeneClick = (gene: Gene, position: number) => {
    if (clickMode) {
      if (clickMode.type === "reroll") {
        reroll(gene, position);
      } else if (clickMode.type === "swap") {
        if (clickMode.p1 == null) {
          clickMode.p1 = { gene, position };
        } else {
          swap(clickMode.p1.gene, clickMode.p1.position, gene, position);
        }
      }
    }
  };

  const maybeClickInstructions = clickMode && (
    clickMode.type === "swap" ? (
      <div>
        Click the two DNA you want to swap
      </div>
    ) : clickMode.type === "reroll" ? (
      <div>
        Click the DNA you want to reroll
      </div>
    ) : null
  );

  return (
    <div className={classNames("mutation-screen", { "click-mode-active": clickMode != null })}>
      <h1>Mutating <Character size="medium" /><span className="name">{species.name}</span></h1>
      <div className="pool">{pool}/{species.freeMutationPoints} MP</div>
      {maybeClickInstructions}
      <SpeciesDetails species={newSpecies} onClick={handleGeneClick} />
      <div className="buttons">
        <PurpleButton onClick={handleNewGene} disabled={pool < newGeneCost}>+ New Gene ({newGeneCost} MP)</PurpleButton>
        <PurpleButton onClick={startSwapClickMode} disabled={pool < 2}>Swap two DNA (2 MP)</PurpleButton>
        <PurpleButton onClick={startRerollClickMode} disabled={pool < 1}>Re-roll Point (1 MP)</PurpleButton>
      </div>
    </div>
  );
}

export default MutationScreen;
