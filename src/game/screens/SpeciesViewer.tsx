import classNames from "classnames";
import configure from "common/configure";
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

const ID_TRASH = "trash";
const ID_GENE_OPTIONS = "gene-options";
const ID_GENES_UNUSED = "genes-unused";

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

          if (result.source.droppableId === ID_GENE_OPTIONS) {
            gene = draft.geneOptions[sourceIndex];

            // delete gene options
            draft.freeMutationPoints -= 1;
            if (draft.freeMutationPoints > 0) {
              draft.geneOptions = populateGeneOptions(draft);
            } else {
              draft.geneOptions = [];
            }
          } else if (result.source.droppableId === ID_GENES_UNUSED) {
            gene = draft.genome.unusedGenes.splice(sourceIndex, 1)[0];
          } else {
            // successful drag; move the gene
            const sourceCell = droppableIdToCell(draft.genome, result.source.droppableId);
            // delete and get gene from source cell
            gene = sourceCell?.chromosome.genes.splice(sourceIndex, 1)[0];
          }

          if (gene != null) {
            if (droppableId === ID_TRASH) {
              // thrown in the trash, do nothing.
            } else if (droppableId === ID_GENES_UNUSED) {
              draft.genome.unusedGenes.splice(destinationIndex, 0, gene);
            } else {
              const destinationCell = droppableIdToCell(draft.genome, droppableId);
              // put gene in destination cell
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
        <UnusedGeneArea genes={species.genome.unusedGenes} isDragging={isDragging} />
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
      <Droppable droppableId={ID_GENE_OPTIONS} isDropDisabled direction="horizontal">
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
    <Droppable droppableId={ID_TRASH}>
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={classNames("trash", { hovered: snapshot.isDraggingOver, foo: configure(snapshot, console.log) })}
        >
          <FaTrash />
          {/* <RealizedGeneViewer gene={tutorialGenome.cellTypes[0].chromosome.genes[0]} index={0} /> */}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

const UnusedGeneArea = ({ genes, isDragging }: { genes: RealizedGene[]; isDragging: boolean }) => {
  return (
    <div className="unused-genes">
      <h1>Unused {genes.length}/5</h1>
      <Droppable droppableId={ID_GENES_UNUSED} direction="horizontal" isDropDisabled={genes.length >= 5}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={classNames("unused-genes-droppable", { dragging: isDragging })}
          >
            {genes.map((gene, index) => (
              <RealizedGeneViewer index={index} key={gene.uuid} gene={gene} draggable view="small" />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
