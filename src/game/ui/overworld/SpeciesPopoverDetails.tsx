import React from "react";
import { Species } from "../../../core/species";
import { Button } from "../common/Button";
import "./SpeciesPopoverDetails.scss";

export interface SpeciesPopoverDetailsProps {
  species: Species;
  onMutate: (species: Species) => void;
}

function SpeciesPopoverDetails({ species, onMutate }: SpeciesPopoverDetailsProps) {
  return (
    <div className="species-details">
      {species.freeMutationPoints > 0 ? (
        <div className="suggestion">{species.freeMutationPoints} Mutation Points available. Use them!</div>
      ) : null}
      <Button onClick={() => onMutate(species)}>Mutate</Button>
    </div>
  );
}

export default SpeciesPopoverDetails;
