import React from "react";

import { Species } from "./species";
import { GeneDisplayProps } from "./GeneDisplay";
import { Button } from "../common/Button";
import GenesToTraits from "./GenesToTraits";

import "./SpeciesPopoverDetails.scss";

export interface SpeciesPopoverDetailsProps {
  species: Species;
  onMutate: (species: Species) => void;
  onClick: GeneDisplayProps["onClick"];
}

function SpeciesPopoverDetails({ species, onClick, onMutate }: SpeciesPopoverDetailsProps) {
  return (
    <div className="species-details">
      <GenesToTraits genes={species.genes} onClick={onClick} />
      {species.freeMutationPoints > 0 ? (
        <div className="suggestion">{species.freeMutationPoints} Mutation Points available. Use them!</div>
      ) : null}
      <Button onClick={() => onMutate(species)}>Mutate</Button>
    </div>
  );
}

export default SpeciesPopoverDetails;
