import React from "react";

import "./PhylogeneticTree.scss";
import { Species } from "./species";
import SpeciesNode from "./SpeciesNode";

interface PhylogeneticTreeProps {
  rootSpecies: Species;
  onMutate: (s: Species) => void;
}

function PhylogeneticTree({ rootSpecies, onMutate }: PhylogeneticTreeProps) {
  return (
    <div className="phylogenetic-tree">
      <div className="title">Phylogenetic Tree</div>
      <div className="tree-nodes">
        <SpeciesNode species={rootSpecies} onMutate={onMutate} />
      </div>
    </div>
  )
}

export default PhylogeneticTree;
