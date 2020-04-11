import classNames from "classnames";
import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { RealizedGene } from "../../../core/cell/realizedGene";
import { GeneCost } from "./GeneCost";
import "./RealizedGeneViewer.scss";

export const RealizedGeneViewer: React.FC<{
  gene: RealizedGene;
  index: number;
  invalid?: boolean;
  draggable?: boolean;
  view?: "small" | "expanded";
}> = ({ index, gene, draggable = true, view = "expanded", invalid = false }) => {
  const { gene: gd } = gene;
  const cost = gene.getCost();
  return (
    <Draggable key={gene.uuid} draggableId={`draggable-${gene.uuid}`} index={index} isDragDisabled={!draggable}>
      {(provided, snapshot, rubric) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={classNames("gene", view, gd.blueprint.name.replace(" ", ""), {
            draggable,
            invalid,
            provider: cost < 0,
          })}
        >
          <div className="gene-header">
            <h4>
              {gd.blueprint.name} {gene.gene.blueprint.levelCosts.length > 1 ? gene.level + 1 : ""}
            </h4>
            <GeneCost cost={cost} />
          </div>

          <div className="description">{gd.blueprint.description(gene.getProps(), gene.getProperties())}</div>
        </div>
      )}
    </Draggable>
  );
};
