import classNames from "classnames";
import { RealizedGene } from "core/cell";
import Genome, { CellType } from "core/cell/genome";
import { newBaseSpecies } from "core/species";
import { populateGeneOptions } from "game/ui/GenomeViewer/generateRandomGenes";
import produce from "immer";
import React, { useCallback, useState } from "react";
import {
  DragDropContext,
  Draggable,
  DragStart,
  DragUpdate,
  Droppable,
  DropResult,
  ResponderProvided,
} from "react-beautiful-dnd";
import { FaTrash } from "react-icons/fa";

const defaultState = newBaseSpecies();
defaultState.geneOptions = populateGeneOptions(defaultState);

function droppableIdToCell(state: Genome, droppableId: string): CellType | undefined {
  return state.cellTypes.find(({ name }) => name === droppableId);
}

function cellToDroppableId(cell: CellType): string {
  return cell.name;
}

const DndTest = () => {
  const [state, setState] = useState(defaultState);

  const onDragEnd = useCallback((result: DropResult, provided: ResponderProvided) => {
    console.log("onDragEnd", result, provided);
    if (result.destination) {
      const sourceIndex = result.source.index;
      const { index: destinationIndex, droppableId } = result.destination;
      setState((state) =>
        produce(state, (draft) => {
          let gene: RealizedGene | undefined;

          if (result.source.droppableId === "gene-options") {
            gene = draft.geneOptions[sourceIndex];
            // delete gene options
            draft.geneOptions = [];
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
        })
      );
    }
  }, []);

  const onDragStart = useCallback((initial: DragStart, provided: ResponderProvided) => {
    console.log("onDragStart", initial, provided);
  }, []);

  const onDragUpdate = useCallback((initial: DragUpdate, provided: ResponderProvided) => {
    console.log("onDragUpdate", initial, provided);
  }, []);

  const debug = false;

  return (
    <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart} onDragUpdate={onDragUpdate}>
      <Droppable droppableId="gene-options" isDropDisabled direction="horizontal">
        {(provided, snapshot) => (
          <div className="gene-options" ref={provided.innerRef} {...provided.droppableProps}>
            {state.geneOptions.map((gene, index) => (
              <Draggable key={gene.uuid} index={index} draggableId={`draggable-${gene.uuid}`}>
                {(provided, snapshot, rubric) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="draggable"
                  >
                    {gene.toString()}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className={classNames("all-cells", { debug })}>
        {state.genome.cellTypes.map((cell) => (
          <Droppable key={cell.name} droppableId={cellToDroppableId(cell)}>
            {(provided, snapshot) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className={classNames("droppable")}>
                {cell.name}
                {debug ? <pre>{JSON.stringify(snapshot, null, 2)}</pre> : null}
                {cell.chromosome.genes.map((gene, index) => (
                  <Draggable key={gene.uuid} draggableId={`draggable-${gene.uuid}`} index={index}>
                    {(provided, snapshot, rubric) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={classNames("draggable")}
                      >
                        {gene.toString()}
                        {debug ? (
                          <>
                            <pre>{JSON.stringify(snapshot, null, 2)}</pre>
                            <pre>{JSON.stringify(rubric, null, 2)}</pre>
                          </>
                        ) : null}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
      <Droppable droppableId="trash">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={classNames("trash", { hovered: snapshot.isDraggingOver })}
          >
            <FaTrash />
            {/* {provided.placeholder} */}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DndTest;
