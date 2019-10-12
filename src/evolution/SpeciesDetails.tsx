import React from "react";

import { Species } from "./species";
import { GeneDisplayProps } from "./GeneDisplay";
import { Button } from "../common/Button";
import MP from "../common/MP";
import GenesToTraits from "./GenesToTraits";

import "./SpeciesDetails.scss";

export interface SpeciesDetailsProps {
  species: Species;
  onMutate: (species: Species) => void;
  onClick: GeneDisplayProps["onClick"];
}

function SpeciesDetails({ species, onClick, onMutate }: SpeciesDetailsProps) {
  return (
    <div className="species-details">
      <GenesToTraits genes={species.genes} onClick={onClick} />
      <p><MP amount={species.freeMutationPoints} />&nbsp; available. Use them!</p>
      <Button onClick={() => onMutate(species)}>Mutate</Button>
    </div>
  );
}

export default SpeciesDetails;
