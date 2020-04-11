import { Tooltip } from "@blueprintjs/core";
import classNames from "classnames";
import { nf } from "common/formatters";
import { TIME_PER_DAY } from "core/constants";
import { useAppReducer } from "game/app";
import React, { useCallback, useContext } from "react";
import { Droppable } from "react-beautiful-dnd";
import { MdDelete } from "react-icons/md";
import Genome, { CellInteraction, CellType } from "../../../core/cell/genome";
import { spritesheetLoaded } from "../../spritesheet";
import DynamicNumber from "../common/DynamicNumber";
import IconCell from "../common/IconCell";
import { CellInteractionSelector } from "./CellInteractionSelector";
import "./CellTypeViewer.scss";
import { cellToDroppableId } from "./droppableId";
import MoreOptionsPopover from "./MoreOptionsPopover";
import { RealizedGeneViewer } from "./RealizedGeneViewer";
import { ViewerContext } from "./viewerState";

export const CellTypeViewer: React.FC<{
  genome: Genome;
  cellType: CellType;
  editable?: boolean;
}> = ({ genome, cellType, editable = false }) => {
  const { name } = cellType;
  const handleSetInteraction = React.useCallback(
    (i: CellInteraction | undefined) => {
      cellType.interaction = i;
    },
    [cellType.interaction]
  );
  const reproducer = cellType.isReproducer();

  return (
    <div className={classNames("cell-type", { reproducer })}>
      <div className="cell-header">
        <IconCell cellType={cellType} spritesheetLoaded={spritesheetLoaded} />
        <div className="cell-name">
          <h2>{name}</h2>
          <CellInteractionSelector interaction={cellType.interaction} setInteraction={handleSetInteraction} />
        </div>
        {editable ? <CellActionsPopover cellType={cellType} genome={genome} /> : null}
      </div>
      <ChromosomeViewer cellType={cellType} />
    </div>
  );
};

// function shouldDisableDrag(droppableCell: CellType, viewerState: ViewerState) {
//   const draggedGene = getDraggedGene(viewerState);

//   if (draggedGene == null) {
//     return false;
//   } else {
//     return droppableCell.chromosome.has(draggedGene.gene);
//   }
// }

const ChromosomeViewer = ({ cellType }: { cellType: CellType }) => {
  const viewerState = useContext(ViewerContext);
  const { editable, view, isDragging } = viewerState;
  const { chromosome } = cellType;
  const { genes } = chromosome;
  const chanceForCancer = cellType.getChanceToBecomeCancerous();
  const cancerEl =
    chanceForCancer > 0 ? (
      <div className="chance-to-cancer">
        Cell may become cancerous: {nf(chanceForCancer * 100 * TIME_PER_DAY, 3)}% per day.
      </div>
    ) : (
      undefined
    );
  const isGeneSlotsOver = chromosome.geneSlotsNet() < 0;
  const tooltipContent = (
    <>
      Once you go over on your gene slots, negative effects will start accruing on your cell.
      {cancerEl}
    </>
  );

  const duplicateGenes = cellType.getDuplicateGenes();
  const validationEl =
    duplicateGenes.size > 0 ? (
      <div className="invalid-alert-text">Cannot have duplicate genes.</div>
    ) : // <Tooltip content="Cannot have duplicate genes. Cell will not build." className="invalid-alert">
    // <MdError />
    // </Tooltip>
    null;

  // const isDropDisabled = shouldDisableDrag(cellType, viewerState);

  return (
    <>
      <Tooltip content={tooltipContent} position="top" popoverClassName="gene-slots-popover" hoverOpenDelay={250}>
        <div className="gene-slots">
          Gene Slots:{" "}
          <span className={classNames("slots-used", { "is-over": isGeneSlotsOver })}>
            <DynamicNumber value={Math.abs(chromosome.geneSlotsNet())} /> {isGeneSlotsOver ? "over" : "under"}.
          </span>
        </div>
      </Tooltip>
      <Droppable key={cellType.name} droppableId={cellToDroppableId(cellType)}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={classNames("chromosome", { dragging: isDragging, invalid: duplicateGenes.size > 0 })}
          >
            {validationEl}
            {genes.map((gene, i) => (
              <RealizedGeneViewer
                index={i}
                key={gene.uuid}
                gene={gene}
                draggable={editable}
                view={view}
                invalid={duplicateGenes.has(gene)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </>
  );
};

const CellActionsPopover: React.FC<{
  cellType: CellType;
  genome: Genome;
}> = ({ cellType, genome }) => {
  const [, dispatch] = useAppReducer();
  const deleteCellType = useCallback(() => {
    const index = genome.cellTypes.indexOf(cellType);
    genome.cellTypes.splice(index, 1);
    dispatch({ type: "AAUpdateSpecies" });
  }, [cellType, dispatch, genome.cellTypes]);

  const chromosomeEmpty = cellType.chromosome.isEmpty();

  return (
    <MoreOptionsPopover>
      <button onClick={deleteCellType} className="delete" disabled={!chromosomeEmpty}>
        <MdDelete />
        {chromosomeEmpty ? "Delete" : "Delete (Remove all genes first)"}
      </button>
    </MoreOptionsPopover>
  );
};
