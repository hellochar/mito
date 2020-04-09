import React, { useCallback } from "react";
import { Species } from "../../../core/species";
import Character from "../common/Character";
import MP from "../common/MP";
import "./SpeciesNode.scss";

export interface SpeciesNodeProps {
  species: Species;
  onMutate: (m: Species) => void;
}

function SpeciesNode({ species, onMutate }: SpeciesNodeProps) {
  const descendants =
    species.descendants.length > 0 ? (
      <div className="descendants-container">
        {species.descendants.map((s, i) => (
          <SpeciesNode key={i} species={s} onMutate={onMutate} />
        ))}
      </div>
    ) : null;
  const handleClick = useCallback(() => {
    onMutate(species);
  }, [onMutate, species]);
  return (
    <div className="species-node">
      {descendants}
      {/* <LookAtMouse zScale={5} onClick={handleClick}> */}
      <div className="species-info" onClick={handleClick}>
        <div className="species-info-name">{species.name}</div>
        <div className="species-info-animation">
          <Character size="small" />
        </div>
        <MP amount={species.freeMutationPoints} />
      </div>
      {/* </LookAtMouse> */}
    </div>
  );
}

export default SpeciesNode;
