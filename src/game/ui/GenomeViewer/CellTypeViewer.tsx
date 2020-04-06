import classNames from "classnames";
import { nf } from "common/formatters";
import { TIME_PER_DAY } from "core/constants";
import { useAppReducer } from "game/app";
import React, { useCallback } from "react";
import { MdDelete } from "react-icons/md";
import Genome, { CellInteraction, CellType } from "../../../core/cell/genome";
import { spritesheetLoaded } from "../../spritesheet";
import DynamicNumber from "../common/DynamicNumber";
import IconCell from "../common/IconCell";
import { CellInteractionSelector } from "./CellInteractionSelector";
import "./CellTypeViewer.scss";
import { DraggedContext } from "./DragInfo";
import { GeneViewer } from "./GeneViewer";
import MoreOptionsPopover from "./MoreOptionsPopover";

export const CellTypeViewer: React.FC<{
  genome: Genome;
  cellType: CellType;
  editable?: boolean;
}> = ({ genome, cellType, editable = false }) => {
  const { chromosome, name } = cellType;
  const [state, setState] = React.useContext(DraggedContext);
  const handleDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (state.dragged != null) {
        const { gene, cellType: leavingCellType } = state.dragged;
        leavingCellType.chromosome.genes = leavingCellType.chromosome.genes.filter((g) => g !== gene);
        cellType.chromosome.genes.push(gene);
        setState((s) => ({ ...s, dragged: undefined }));
      }
    },
    [cellType.chromosome.genes, state.dragged, setState]
  );
  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);
  const handleSetInteraction = React.useCallback(
    (i: CellInteraction | undefined) => {
      cellType.interaction = i;
    },
    [cellType.interaction]
  );
  const reproducer = cellType.isReproducer();

  const chanceForCancer = cellType.getChanceToBecomeCancerous();
  const cancerEl =
    chanceForCancer > 0 ? (
      <div className="chance-to-cancer">
        Cell may become cancerous: {nf(chanceForCancer * 100 * TIME_PER_DAY, 3)}% per day.
      </div>
    ) : null;

  const isGeneSlotsOver = chromosome.geneSlotsNet() < 0;

  return (
    <div className={classNames("cell-type", { reproducer })}>
      <div className="cell-header">
        <IconCell cellType={cellType} spritesheetLoaded={spritesheetLoaded} />
        <div className="cell-name">
          <h2>{name}</h2>
          <CellInteractionSelector
            key={cellType.name}
            interaction={cellType.interaction}
            setInteraction={handleSetInteraction}
          />
        </div>
        {editable ? <CellActionsPopover cellType={cellType} genome={genome} /> : null}
      </div>
      <div className="gene-slots">
        Gene Slots:{" "}
        <span className={classNames("slots-used", { "is-over": isGeneSlotsOver })}>
          <DynamicNumber value={Math.abs(chromosome.geneSlotsNet())} /> {isGeneSlotsOver ? "over" : "under"}.
        </span>
      </div>
      {cancerEl}
      <div className="chromosome" onDragOver={handleDragOver} onDrop={handleDrop}>
        {chromosome.genes.map((gene, i) => (
          <GeneViewer key={gene.uuid} cellType={cellType} gene={gene} editable={editable} />
        ))}
      </div>
    </div>
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
