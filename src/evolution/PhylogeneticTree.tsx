import React from "react";

import "./PhylogeneticTree.scss";
import { Species } from "./species";

interface PhylogeneticTreeProps {
  rootSpecies: Species;
}

function TreeNode({ species }: { species: Species }) {
  const descendants = species.descendants.length > 0
    ? (
      <div className="descendants-container">
        {species.descendants.map((s) => <TreeNode species={s} />)}
      </div>
    ) : null;

  return (
    <div className="tree-node">
      {descendants}
      <div className="species-info">
        <img src="/assets/images/character.png" alt="" />
        <div className="species-info-name">{species.name}</div>
        <div>{species.freeMutationPoints} points</div>
      </div>
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
