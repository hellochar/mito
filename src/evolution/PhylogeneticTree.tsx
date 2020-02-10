import { useAppReducer } from "game/app";
import React from "react";
import "./PhylogeneticTree.scss";
import { Species } from "./species";
import SpeciesNode from "./SpeciesNode";

interface PhylogeneticTreeProps {
  onMutate: (s: Species) => void;
}

function PhylogeneticTree({ onMutate }: PhylogeneticTreeProps) {
  const [{ rootSpecies }] = useAppReducer();
  return (
    <div className="phylogenetic-tree">
      <div className="title">Phylogenetic Tree</div>
      <div className="tree-nodes">
        <SpeciesNode species={rootSpecies} onMutate={onMutate} />
      </div>
    </div>
  );
}

export default PhylogeneticTree;
