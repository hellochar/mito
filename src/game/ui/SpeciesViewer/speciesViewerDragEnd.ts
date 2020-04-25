import { RealizedGene } from "core/cell";
import { Species } from "core/species";
import { AppActions } from "game/app";
import { geneDrop } from "game/audio";
import produce from "immer";
import { DropResult, ResponderProvided } from "react-beautiful-dnd";
import { droppableIdToCell } from "./droppableId";
import { generateGeneOptions } from "./generateGeneOptions";

export const ID_TRASH = "trash";
export const ID_GENE_OPTIONS = "gene-options";
export const ID_GENES_UNUSED = "genes-unused";

function speciesViewerDragEnd(
  result: DropResult,
  provided: ResponderProvided,
  species: Species,
  dispatch: React.Dispatch<AppActions>
) {
  if (result.destination != null && result.destination.droppableId !== ID_GENE_OPTIONS) {
    geneDrop.play();
    const sourceIndex = result.source.index;
    const { index: destinationIndex, droppableId } = result.destination;
    const newSpecies = produce(species, (draft) => {
      let gene: RealizedGene | undefined;
      let shouldRepopulateGeneOptions = false;

      if (result.source.droppableId === ID_GENE_OPTIONS) {
        gene = draft.geneOptions[sourceIndex];

        // delete gene options
        draft.freeMutationPoints -= 1;
        if (draft.freeMutationPoints > 0) {
          shouldRepopulateGeneOptions = true;
        } else {
          draft.geneOptions = [];
        }
      } else if (result.source.droppableId === ID_GENES_UNUSED) {
        gene = draft.genome.unusedGenes.splice(sourceIndex, 1)[0];
      } else {
        // drag between cells; move the gene
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
      if (shouldRepopulateGeneOptions) {
        draft.geneOptions = generateGeneOptions(draft, false);
      }
    });
    dispatch({
      type: "AAUpdateSpecies",
      species: newSpecies,
    });
  }
}

export default speciesViewerDragEnd;
