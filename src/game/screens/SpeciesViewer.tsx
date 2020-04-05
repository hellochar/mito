import { Species } from "core/species";
import { useAppReducer } from "game/app";
import LookAtMouse from "game/ui/common/LookAtMouse";
import MP from "game/ui/common/MP";
import GenomeViewer from "game/ui/GenomeViewer";
import { DraggedContext, GenomeViewerState } from "game/ui/GenomeViewer/DragInfo";
import { populateGeneOptions } from "game/ui/GenomeViewer/generateRandomGenes";
import { GeneViewer } from "game/ui/GenomeViewer/GeneViewer";
import React, { useEffect } from "react";
import "./SpeciesViewer.scss";
export const SpeciesViewer: React.FC<{
  species: Species;
}> = ({ species }) => {
  return (
    <div className="species-viewer">
      <div className="header">
        <div className="species-name">{species.name}</div>
      </div>
      {species.freeMutationPoints > 0 ? <MutationChooser species={species} /> : null}
      <GenomeViewer genome={species.genome} editable={true} />
    </div>
  );
};

const MutationChooser: React.FC<{ species: Species }> = ({ species }) => {
  const { freeMutationPoints, geneOptions } = species;
  const geneEl = geneOptions.map((gene, i) => (
    <LookAtMouse zScale={8} displayBlock>
      <GeneViewer key={i} gene={gene} cellType={undefined!} draggable />
    </LookAtMouse>
  ));

  const tuple = React.useState<GenomeViewerState>({ view: "expanded" });
  const [state, setState] = tuple;
  const [, dispatch] = useAppReducer();

  useEffect(() => {
    if (state.dragged) {
      // HACK add clicked genome to first cell type
      species.genome.cellTypes[0].chromosome.genes.push(state.dragged.gene);
      species.freeMutationPoints -= 1;
      if (species.freeMutationPoints > 0) {
        species.geneOptions = populateGeneOptions(species);
      }
      setState({
        ...state,
        dragged: undefined,
      });
      dispatch({
        type: "AAUpdateSpecies",
        species,
      });
    }
  }, [
    dispatch,
    setState,
    species,
    species.freeMutationPoints,
    species.geneOptions,
    species.genome.cellTypes,
    state,
    state.dragged,
  ]);

  return (
    <DraggedContext.Provider value={tuple}>
      <div className="mutation-chooser">
        <h1>
          <MP amount={freeMutationPoints} /> mutations available
        </h1>
        <div className="gene-options">{geneEl}</div>
      </div>
    </DraggedContext.Provider>
  );
};
