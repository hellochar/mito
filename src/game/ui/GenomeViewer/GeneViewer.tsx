import classNames from "classnames";
import React from "react";
import { CellType } from "../../../core/cell/genome";
import { RealizedGene } from "../../../core/cell/realizedGene";
import { DraggedContext } from "./DragInfo";
import { GeneCost } from "./GeneCost";
import "./GeneViewer.scss";

export const GeneViewer: React.FC<{
  cellType: CellType;
  gene: RealizedGene;
}> = ({ cellType, gene }) => {
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
  // const draggable = !(gene.gene.blueprint.name === "Living");
  const draggable = true;
  return (
    // <LookAtMouse zScale={8} displayBlock>
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
        {/* {draggable ? <FaGripLines className="grip-lines" /> : null} */}
      </div>

      <div className="description">{gd.blueprint.description(gene.getProps(), gene.getStaticProperties())}</div>
    </div>
    // </LookAtMouse>
  );
};
