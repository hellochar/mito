import { useAppReducer } from "game/app";
import React from "react";
import { Species } from "../../../core/species";
import "./PhylogeneticTree.scss";
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
