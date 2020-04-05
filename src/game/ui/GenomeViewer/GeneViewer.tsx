import classNames from "classnames";
import { useAppReducer } from "game/app";
import React, { useCallback } from "react";
import { MdDelete } from "react-icons/md";
import { CellType } from "../../../core/cell/genome";
import { RealizedGene } from "../../../core/cell/realizedGene";
import { DraggedContext } from "./DragInfo";
import { GeneCost } from "./GeneCost";
import "./GeneViewer.scss";
import MoreOptionsPopover from "./MoreOptionsPopover";

export const GeneViewer: React.FC<{
  cellType: CellType;
  gene: RealizedGene;
  editable?: boolean;
  draggable?: boolean;
}> = ({ cellType, gene, editable = false, draggable = editable }) => {
  const [state, setState] = React.useContext(DraggedContext);
  const { gene: gd } = gene;
  const handleDragStart = React.useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData("mito/gene", "data");
      setState((s) => ({
        ...s,
        dragged: {
          cellType,
          gene,
        },
      }));
    },
    [cellType, gene, setState]
  );
  const cost = gene.getCost();
  return (
    <div
      className={classNames("gene", state.view, gd.blueprint.name.replace(" ", ""), { draggable })}
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <div className="gene-header">
        <GeneCost cost={cost} />
        <h4>
          {gd.blueprint.name} {gene.gene.blueprint.levelCosts.length > 1 ? gene.level + 1 : ""}
        </h4>
        {editable ? <GeneActionsPopover cellType={cellType} gene={gene} /> : null}
      </div>

      <div className="description">{gd.blueprint.description(gene.getProps(), gene.getStaticProperties())}</div>
    </div>
  );
};

const GeneActionsPopover: React.FC<{
  cellType: CellType;
  gene: RealizedGene;
}> = ({ cellType, gene }) => {
  const [, dispatch] = useAppReducer();
  const deleteGene = useCallback(() => {
    const index = cellType.chromosome.genes.indexOf(gene);
    cellType.chromosome.genes.splice(index, 1);
    dispatch({ type: "AAUpdateSpecies" });
  }, [cellType.chromosome.genes, dispatch, gene]);

  return (
    <MoreOptionsPopover>
      <button onClick={deleteGene} className="delete">
        <MdDelete />
        Delete
      </button>
    </MoreOptionsPopover>
  );
};
