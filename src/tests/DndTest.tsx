import { newBaseSpecies } from "core/species";
import { populateGeneOptions } from "game/ui/SpeciesViewer/generateRandomGenes";

const defaultState = newBaseSpecies();
defaultState.geneOptions = populateGeneOptions(defaultState);

const debug = false;

const DndTest = () => {
  // const [state, setState] = useState(defaultState);

  // const onDragEnd = useCallback((result: DropResult, provided: ResponderProvided) => {
  //   console.log("onDragEnd", result, provided);
  //   if (result.destination) {
  //     const sourceIndex = result.source.index;
  //     const { index: destinationIndex, droppableId } = result.destination;
  //     setState((state) =>
  //       produce(state, (draft) => {
  //         let gene: RealizedGene | undefined;

  //         if (result.source.droppableId === "gene-options") {
  //           gene = draft.geneOptions[sourceIndex];
  //           // delete gene options
  //           draft.geneOptions = [];
  //         } else {
  //           // successful drag; move the gene
  //           const sourceCell = droppableIdToCell(draft.genome, result.source.droppableId);
  //           // delete and get gene from source cell
  //           gene = sourceCell?.chromosome.genes.splice(sourceIndex, 1)[0];
  //         }

  //         if (droppableId === "trash") {
  //           // thrown in the trash, do nothing.
  //         } else {
  //           const destinationCell = droppableIdToCell(draft.genome, droppableId);
  //           // put gene in destination cell
  //           if (gene != null) {
  //             destinationCell?.chromosome.genes.splice(destinationIndex, 0, gene);
  //           }
  //         }
  //       })
  //     );
  //   }
  // }, []);

  return null;
  // <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart} onDragUpdate={onDragUpdate}>
  // {/* {state.geneOptions.length > 0 ? <GeneOptions geneOptions={state.geneOptions} /> : null} */}
  /* <div className={classNames("all-cells", { debug })}>
        {state.genome.cellTypes.map((cell) => (
          <Droppable key={cell.name} droppableId={cellToDroppableId(cell)}>
            {(provided, snapshot) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className={classNames("droppable")}>
                {cell.name}
                {debug ? <pre>{JSON.stringify(snapshot, null, 2)}</pre> : null}
                {cell.chromosome.genes.map((gene, index) => (
                  <RealizedGeneViewer key={gene.uuid} gene={gene} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div> */

  // {/* <DeleteGeneDroppable /> */}
  // {/* </DragDropContext> */}
};

export default DndTest;
