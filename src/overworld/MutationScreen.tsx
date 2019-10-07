import React from "react";

import { Species } from "../evolution/species";

import "./MutationScreen.scss";
import SpeciesDetails from "../evolution/SpeciesDetails";
import { PurpleButton } from "../evolution/PurpleButton";
import { mutateRandomNewGene } from "../evolution/mutation";

function MutationScreen({ species }: { species: Species }) {
  const [newSpecies, setNewSpecies] = React.useState<Species>({
    descendants: [],
    freeMutationPoints: 0,
    genes: [...species.genes],
    name: "New species",
    parent: species,
  });

  const handleNewGene = () => {
    setNewSpecies((species) => ({
      ...species,
      genes: [...species.genes, mutateRandomNewGene()],
    }));
  };

  const handleSwapDNA = () => {

  };

  const handleReroll = () => {

  };

  const newGeneCost = newSpecies.genes.length + 1;
  return (
    <div className="mutation-screen">
      <h1>Mutate</h1>
      <SpeciesDetails species={newSpecies} />
      <div className="buttons">
        <PurpleButton onClick={handleNewGene}>+ New Gene ({newGeneCost} MP)</PurpleButton>
        <PurpleButton onClick={handleSwapDNA}>Swap two DNA (2 MP)</PurpleButton>
        <PurpleButton onClick={handleReroll}>Re-roll Point (1 MP)</PurpleButton>
      </div>
    </div>
  );
}

export default MutationScreen;
