import React from "react";
import { Species } from "./species";
import Popover from "react-popover";
import SpeciesPopoverDetails from "./SpeciesPopoverDetails";
import Character from "../common/Character";
import MP from "../common/MP";

import "./SpeciesNode.scss";
import LookAtMouse from "common/LookAtMouse";

export interface SpeciesNodeProps {
  species: Species;
  onMutate: (m: Species) => void;
}

function SpeciesNode({ species, onMutate }: SpeciesNodeProps) {
  const handleOnMutate = (s: Species) => {
    setPopoverIsOpen(false);
    onMutate(s);
  };

  const [popoverIsOpen, setPopoverIsOpen] = React.useState(false);

  const descendants = species.descendants.length > 0
    ? (
      <div className="descendants-container">
        {species.descendants.map((s, i) => <SpeciesNode key={i} species={s} onMutate={handleOnMutate} />)}
      </div>
    ) : null;
  const popoverBody = (
    <div className="species-detail-popover">
      <SpeciesPopoverDetails species={species} onMutate={handleOnMutate} onClick={() => { }} />
    </div>
  );
  return (
    <div className="species-node">
      {descendants}
      <Popover isOpen={popoverIsOpen} preferPlace="right" onOuterAction={() => setPopoverIsOpen(false)} body={popoverBody}>
        <LookAtMouse zScale={5}>
          <div className="species-info" onClick={() => setPopoverIsOpen(!popoverIsOpen)}>
            <div className="species-info-name">{species.name}</div>
            <div className="species-info-animation">
              <Character size="small" />
            </div>
            <MP amount={species.freeMutationPoints} />
          </div>
        </LookAtMouse>
      </Popover>
    </div>
  );
}

export default SpeciesNode;
