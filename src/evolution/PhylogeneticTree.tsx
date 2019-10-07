import React from "react";

import "./PhylogeneticTree.scss";
import { Species } from "./species";
import Popover from "react-popover";
import TraitDisplay from "./TraitDisplay";
import { getTraits } from "./traits";
import GeneDisplay from "./GeneDisplay";

interface PhylogeneticTreeProps {
  rootSpecies: Species;
  onMutate: (s: Species) => void;
}

function SpeciesDetails({ species, onMutate }: { species: Species, onMutate: (species: Species) => void }) {
  const traits = React.useMemo(() => {
    return getTraits(species.genes);
  }, [species.genes]);

  return (
    <div className="species-details-container">
      <div className="genes-to-traits">
        <div className="genes-details">
          <h3>Genes</h3>
          <GeneDisplay genes={species.genes} mutationPoints={species.freeMutationPoints} />
        </div>
        <div className="arrow">⇒</div>
        <div className="traits-details">
          <h3>Traits</h3>
          <TraitDisplay traits={traits} />
        </div>
      </div>
      <button className="mutate-button" onClick={() => onMutate(species)}>Mutate</button>
    </div>
  );
}

function TreeNode({ species, onMutate }: { species: Species, onMutate: (m: Species) => void }) {
  const [popoverIsOpen, setPopoverIsOpen] = React.useState(false);

  const descendants = species.descendants.length > 0
    ? (
      <div className="descendants-container">
        {species.descendants.map((s, i) => <TreeNode key={i} species={s} onMutate={onMutate} />)}
      </div>
    ) : null;

  return (
    <div className="tree-node">
      {descendants}
      <Popover
        isOpen={popoverIsOpen}
        preferPlace="right"
        onOuterAction={() => setPopoverIsOpen(false)}
        body={<SpeciesDetails species={species} onMutate={onMutate} />}
      >
        <div className="species-info-animation">
          <div className="species-info" onClick={() => setPopoverIsOpen(!popoverIsOpen)}>
            <img src="/assets/images/character.png" alt="" />
            <div className="species-info-name">{species.name}</div>
            <div>{species.freeMutationPoints} MP</div>
          </div>
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
