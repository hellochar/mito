import classNames from "classnames";
import { nf } from "common/formatters";
import { TIME_PER_DAY } from "core/constants";
import React from "react";
import { CellInteraction, CellType } from "../../../core/cell/genome";
import { spritesheetLoaded } from "../../spritesheet";
import DynamicNumber from "../common/DynamicNumber";
import IconCell from "../common/IconCell";
import { CellInteractionSelector } from "./CellInteractionSelector";
import "./CellTypeViewer.scss";
import { DraggedContext } from "./DragInfo";
import { GeneViewer } from "./GeneViewer";

export const CellTypeViewer: React.FC<{
  cellType: CellType;
}> = ({ cellType }) => {
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
        <div>
          <h2>{name}</h2>
          <CellInteractionSelector
            key={cellType.name}
            interaction={cellType.interaction}
            setInteraction={handleSetInteraction}
          />
        </div>
      </div>
      <div className="gene-slots">
        Gene Slots:{" "}
        <span className={classNames("slots-used", { "is-over": isGeneSlotsOver })}>
          <DynamicNumber value={Math.abs(chromosome.geneSlotsNet())} /> {isGeneSlotsOver ? "over" : "under"}.
        </span>
      </div>
      {cancerEl}
      <div className="chromosome" onDragOver={handleDragOver} onDrop={handleDrop}>
        {chromosome.genes.map((g, i) => (
          <GeneViewer key={i} cellType={cellType} gene={g} />
        ))}
      </div>
    </div>
  );
};
