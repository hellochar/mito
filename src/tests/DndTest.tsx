import classNames from "classnames";
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

type Cell = { readonly name: string; readonly genes: number[] };
export type Genome = Cell[];
const defaultState: Genome = [
  {
    name: "cell1",
    genes: [1, 2, 3],
  },
  {
    name: "cell2",
    genes: [4, 5],
  },
];

function droppableIdToCell(state: Genome, droppableId: string): Cell {
  return state.find(({ name }) => name === droppableId)!;
}

function cellToDroppableId(cell: Cell): string {
  return cell.name;
}

const DndTest = () => {
  const onDragEnd = useCallback((result: DropResult, provided: ResponderProvided) => {
    console.log("onDragEnd", result, provided);
    if (result.destination) {
      const sourceIndex = result.source.index;
      const { index: destinationIndex, droppableId } = result.destination;
      setState((state) =>
        produce(state, (draft) => {
          // successful drag; move the gene
          const sourceCell = droppableIdToCell(draft, result.source.droppableId);
          const destinationCell = droppableIdToCell(draft, droppableId);

          // delete and get gene from source cell
          const [gene] = sourceCell.genes.splice(sourceIndex, 1);

          // put gene in destination cell
          destinationCell.genes.splice(destinationIndex, 0, gene);
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

  const [state, setState] = useState(defaultState);

  return (
    <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart} onDragUpdate={onDragUpdate}>
      <div className="all-cells">
        {state.map((cell) => (
          <Droppable key={cell.name} droppableId={cellToDroppableId(cell)}>
            {(provided, snapshot) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className={classNames("droppable")}>
                {cell.name}
                <pre>{JSON.stringify(snapshot, null, 2)}</pre>
                {cell.genes.map((gene, index) => (
                  <Draggable key={gene} draggableId={`draggable-${gene}`} index={index}>
                    {(provided, snapshot, rubric) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={classNames("draggable")}
                      >
                        Draggable {gene}
                        <pre>{JSON.stringify(snapshot, null, 2)}</pre>
                        <pre>{JSON.stringify(rubric, null, 2)}</pre>
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
    </DragDropContext>
  );
};

export default DndTest;
