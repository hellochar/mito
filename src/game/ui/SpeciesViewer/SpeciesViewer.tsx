import classNames from "classnames";
import configure from "common/configure";
import { RealizedGene } from "core/cell";
import { lineage, Species } from "core/species";
import { useAppReducer } from "game/app";
import { genePickUp } from "game/audio";
import MP from "game/ui/common/MP";
import React, { useCallback, useState } from "react";
import { BeforeCapture, DragDropContext, Droppable, DropResult, ResponderProvided } from "react-beautiful-dnd";
import { FaArrowsAltV, FaTrash } from "react-icons/fa";
import { TiThMenu } from "react-icons/ti";
import GenomeViewer from "./GenomeViewer";
import { RealizedGeneViewer } from "./RealizedGeneViewer";
import "./SpeciesViewer.scss";
import speciesViewerDragEnd, { ID_GENES_UNUSED, ID_GENE_OPTIONS, ID_TRASH } from "./speciesViewerDragEnd";
import { ViewerContext } from "./viewerState";

const SpeciesViewer: React.FC<{
  speciesId: string;
  editable?: boolean;
}> = ({ speciesId, editable = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = React.useState<"small" | "expanded">("small");
  const [state, dispatch] = useAppReducer();
  const species = lineage(state.rootSpecies).find((s) => s.id === speciesId)!;

  const viewerState = React.useMemo(() => ({ species, view, editable, isDragging }), [
    editable,
    isDragging,
    species,
    view,
  ]);

  const handleDragEnd = useCallback(
    (result: DropResult, provided: ResponderProvided) => {
      console.log("onDragEnd", result, provided);
      setIsDragging(false);
      speciesViewerDragEnd(result, provided, species, dispatch);
    },
    [dispatch, species]
  );

  const handleBeforeCapture = useCallback((before: BeforeCapture) => {
    setIsDragging(true);
    genePickUp.play();
  }, []);
  const handleViewSmall = useCallback(() => {
    setView("small");
  }, []);
  const handleViewExpanded = useCallback(() => {
    setView("expanded");
  }, []);

  return (
    <DragDropContext onDragEnd={handleDragEnd} onBeforeCapture={handleBeforeCapture}>
      <ViewerContext.Provider value={viewerState}>
        <div className="species-viewer">
          <div className="species-name">{species.name}</div>
          <div className="view-switcher">
            <TiThMenu onClick={handleViewSmall} className={classNames({ active: view === "small" })} />
            <FaArrowsAltV onClick={handleViewExpanded} className={classNames({ active: view === "expanded" })} />
          </div>
          {species.freeMutationPoints > 0 && editable ? <MutationChooser species={species} /> : null}
          {isDragging ? <DeleteGeneDroppable /> : null}
          <GenomeViewer genome={species.genome} />
          {editable || species.genome.unusedGenes.length > 0 ? (
            <UnusedGeneArea genes={species.genome.unusedGenes} />
          ) : null}
        </div>
      </ViewerContext.Provider>
    </DragDropContext>
  );
};

export default SpeciesViewer;

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
              <RealizedGeneViewer index={index} key={gene.uuid} gene={gene} draggable view="expanded" />
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

const UnusedGeneArea = ({ genes }: { genes: RealizedGene[] }) => {
  const { isDragging, view, editable } = React.useContext(ViewerContext);
  return (
    <div className="unused-genes">
      <h2>Unused {genes.length}/5</h2>
      <Droppable droppableId={ID_GENES_UNUSED} direction="horizontal" isDropDisabled={genes.length >= 5}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={classNames("unused-genes-droppable", { dragging: isDragging })}
          >
            {genes.map((gene, index) => (
              <RealizedGeneViewer index={index} key={gene.uuid} gene={gene} draggable={editable} view={view} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
