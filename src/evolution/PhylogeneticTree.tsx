import React from "react";

import "./PhylogeneticTree.scss";
import { Species } from "./species";
import Popover from "react-popover";
import TraitDisplay from "./TraitDisplay";
import { getTraits } from "./traits";

interface PhylogeneticTreeProps {
  rootSpecies: Species;
}

function TreeNode({ species }: { species: Species }) {
  const [popoverIsOpen, setPopoverIsOpen] = React.useState(false);

  const descendants = species.descendants.length > 0
    ? (
      <div className="descendants-container">
        {species.descendants.map((s) => <TreeNode species={s} />)}
      </div>
    ) : null;

  const traits = React.useMemo(() => {
    return getTraits(species.genes);
  }, [species.genes]);

  return (
    <div className="tree-node">
      {descendants}
      <Popover
        isOpen={popoverIsOpen}
        preferPlace="right"
        onOuterAction={() => setPopoverIsOpen(false)}
        body={<div className="trait-container"><h3>Traits</h3><TraitDisplay traits={traits} /></div>}
      >
        <div className="species-info" onClick={() => setPopoverIsOpen(!popoverIsOpen)}>
          <img src="/assets/images/character.png" alt="" />
          <div className="species-info-name">{species.name}</div>
          <div>{species.freeMutationPoints} MP</div>
        </div>
      </Popover>
    </div>
  );
}

function PhylogeneticTree({ rootSpecies }: PhylogeneticTreeProps) {
  return (
    <div className="phylogenetic-tree">
      <h1>Phylogenetic Tree</h1>
      <div className="tree-nodes">
        <TreeNode species={rootSpecies} />
      </div>
    </div>
  )
}

export default PhylogeneticTree;
