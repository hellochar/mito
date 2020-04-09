import classNames from "classnames";
import { RealizedGene } from "core/cell";
import { lineage, Species } from "core/species";
import { useAppReducer } from "game/app";
import MP from "game/ui/common/MP";
import GenomeViewer from "game/ui/GenomeViewer";
import { droppableIdToCell } from "game/ui/GenomeViewer/droppableId";
import { populateGeneOptions } from "game/ui/GenomeViewer/generateRandomGenes";
import { RealizedGeneViewer } from "game/ui/GenomeViewer/RealizedGeneViewer";
import produce from "immer";
import React, { useCallback, useState } from "react";
import { DragDropContext, Droppable, DropResult, ResponderProvided } from "react-beautiful-dnd";
import { FaTrash } from "react-icons/fa";
import "./SpeciesViewer.scss";

export const SpeciesViewer: React.FC<{
  speciesId: string;
}> = ({ speciesId }) => {
  const [state, dispatch] = useAppReducer();
  const species = lineage(state.rootSpecies).find((s) => s.id === speciesId)!;
  const handleDragEnd = useCallback(
    (result: DropResult, provided: ResponderProvided) => {
      console.log("onDragEnd", result, provided);
      setIsDragging(false);
      if (result.destination) {
        const sourceIndex = result.source.index;
        const { index: destinationIndex, droppableId } = result.destination;
        const newSpecies = produce(species, (draft) => {
          let gene: RealizedGene | undefined;

          if (result.source.droppableId === "gene-options") {
            gene = draft.geneOptions[sourceIndex];

            // delete gene options
            draft.freeMutationPoints -= 1;
            if (draft.freeMutationPoints > 0) {
              draft.geneOptions = populateGeneOptions(draft);
            } else {
              draft.geneOptions = [];
            }
          } else {
            // successful drag; move the gene
            const sourceCell = droppableIdToCell(draft.genome, result.source.droppableId);
            // delete and get gene from source cell
            gene = sourceCell?.chromosome.genes.splice(sourceIndex, 1)[0];
          }

          if (droppableId === "trash") {
            // thrown in the trash, do nothing.
          } else {
            const destinationCell = droppableIdToCell(draft.genome, droppableId);
            // put gene in destination cell
            if (gene != null) {
              destinationCell?.chromosome.genes.splice(destinationIndex, 0, gene);
            }
          }
        });
        dispatch({
          type: "AAUpdateSpecies",
          species: newSpecies,
        });
      }
    },
    [dispatch, species]
  );

  const [isDragging, setIsDragging] = useState(false);

  const handleBeforeCapture = useCallback(() => {
    setIsDragging(true);
  }, []);

  return (
    <DragDropContext onDragEnd={handleDragEnd} onBeforeCapture={handleBeforeCapture}>
      <div className="species-viewer">
        <div className="header">
          <div className="species-name">{species.name}</div>
        </div>
        {species.freeMutationPoints > 0 ? <MutationChooser species={species} /> : null}
        {isDragging ? <DeleteGeneDroppable /> : null}
        <GenomeViewer genome={species.genome} editable isDragging={isDragging} />
      </div>
    </DragDropContext>
  );
};

const MutationChooser: React.FC<{ species: Species }> = ({ species }) => {
  const { freeMutationPoints, geneOptions } = species;
  return (
    <div className="mutation-chooser">
      <h1>
        <MP amount={freeMutationPoints} /> mutations available
      </h1>
      <Droppable droppableId="gene-options" isDropDisabled direction="horizontal">
        {(provided, snapshot) => (
          <div className="gene-options" ref={provided.innerRef} {...provided.droppableProps}>
            {geneOptions.map((gene, index) => (
              // <LookAtMouse zScale={8} displayBlock>
              <RealizedGeneViewer index={index} key={gene.uuid} gene={gene} draggable />
              // </LookAtMouse>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const DeleteGeneDroppable = () => {
  return (
    <Droppable droppableId="trash">
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={classNames("trash", { hovered: snapshot.isDraggingOver })}
        >
          <FaTrash />
          {/* <RealizedGeneViewer gene={tutorialGenome.cellTypes[0].chromosome.genes[0]} index={0} /> */}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
