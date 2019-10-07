import React, { HTMLProps } from "react";
import { Species } from "./species";
import TraitDisplay from "./TraitDisplay";
import { getTraits } from "./traits";
import GeneDisplay, { GeneDisplayProps } from "./GeneDisplay";

import "./SpeciesDetails.scss";
import { PurpleButton } from "./PurpleButton";

export interface SpeciesDetailsProps {
  species: Species;
  onMutate?: (species: Species) => void;
  onClick: GeneDisplayProps["onClick"];
}

function SpeciesDetails({ species, onClick, onMutate }: SpeciesDetailsProps) {

  const traits = React.useMemo(() => {
    return getTraits(species.genes);
  }, [species.genes]);

  return (<div className="species-details">
    <div className="genes-to-traits">
      <div className="genes-details">
        <h3>Genes</h3>
        <GeneDisplay genes={species.genes} onClick={onClick} />
      </div>
      <div className="arrow">⇒</div>
      <div className="traits-details">
        <h3>Traits</h3>
        <TraitDisplay traits={traits} />
      </div>
    </div>
    {onMutate ? <PurpleButton onClick={() => onMutate(species)}>Mutate</PurpleButton> : null}
  </div>);
}

export default SpeciesDetails;
