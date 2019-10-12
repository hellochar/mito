import React from "react";

import "./PhylogeneticTree.scss";
import { Species } from "./species";
import Popover from "react-popover";
import SpeciesDetails from "./SpeciesDetails";
import Character from "../common/Character";
import MP from "../common/MP";

interface PhylogeneticTreeProps {
  rootSpecies: Species;
  onMutate: (s: Species) => void;
}

function TreeNode({ species, onMutate }: { species: Species, onMutate: (m: Species) => void }) {
  const handleOnMutate = (s: Species) => {
    setPopoverIsOpen(false);
    onMutate(s);
  };

  const [popoverIsOpen, setPopoverIsOpen] = React.useState(false);

  const descendants = species.descendants.length > 0
    ? (
      <div className="descendants-container">
        {species.descendants.map((s, i) => <TreeNode key={i} species={s} onMutate={handleOnMutate} />)}
      </div>
    ) : null;

  const popoverBody = (
    <div className="species-detail-popover">
      <SpeciesDetails species={species} onMutate={handleOnMutate} onClick={() => { }} />
    </div>
  );

  return (
    <div className="tree-node">
      {descendants}
      <Popover
        isOpen={popoverIsOpen}
        preferPlace="right"
        onOuterAction={() => setPopoverIsOpen(false)}
        body={popoverBody}
      >
        <div className="species-info" onClick={() => setPopoverIsOpen(!popoverIsOpen)}>
          <div className="species-info-name">{species.name}</div>
          <div className="species-info-animation">
            <Character size="large" />
          </div>
          <MP amount={species.freeMutationPoints} />
        </div>
      </Popover>
    </div>
  );
}

function PhylogeneticTree({ rootSpecies, onMutate }: PhylogeneticTreeProps) {
  return (
    <div className="phylogenetic-tree">
      <div className="title">Phylogenetic Tree</div>
      <div className="tree-nodes">
        <TreeNode species={rootSpecies} onMutate={onMutate} />
      </div>
    </div>
  )
}

export default PhylogeneticTree;
