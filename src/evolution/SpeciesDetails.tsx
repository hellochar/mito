import React from "react";
import { Species } from "./species";
import TraitDisplay from "./TraitDisplay";
import { getTraits } from "./traits";
import GeneDisplay, { GeneDisplayProps } from "./GeneDisplay";

import "./SpeciesDetails.scss";
import { Button } from "./Button";

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
    {onMutate ? <Button onClick={() => onMutate(species)}>Mutate</Button> : null}
  </div>);
}

export default SpeciesDetails;
