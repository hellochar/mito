import classNames from "classnames";
import { nf } from "common/formatters";
import { TIME_PER_DAY } from "core/constants";
import { arrayRange } from "math/arrays";
import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { GiElectric } from "react-icons/gi";
import { RealizedGene } from "../../../core/cell/realizedGene";
import { GeneCost } from "./GeneCost";
import "./RealizedGeneViewer.scss";

const EnergyUpkeep: React.FC<{ upkeep: number }> = ({ upkeep }) => {
  let els: JSX.Element;
  if (upkeep % 1 === 0 && upkeep <= 3) {
    els = (
      <>
        {arrayRange(upkeep).map((i) => (
          <GiElectric key={i} />
        ))}
      </>
    );
  } else {
    els = (
      <>
        {nf(upkeep * 100 * TIME_PER_DAY, 3)}% <GiElectric />
        /day
      </>
    );
  }
  return <div className="energy-upkeep">{els}</div>;
};

export const RealizedGeneViewer: React.FC<{
  gene: RealizedGene;
  index: number;
  invalid?: boolean;
  draggable?: boolean;
  view?: "small" | "expanded";
}> = ({ index, gene, draggable = true, view = "expanded", invalid = false }) => {
  const { gene: gd } = gene;
  const cost = gene.getCost();
  const energyUpkeepEl = gene.getStaticProperties().energyUpkeep ? (
    <EnergyUpkeep upkeep={gene.getStaticProperties().energyUpkeep!} />
  ) : null;
  const geneLevelEl =
    gene.level > 0 ? (
      <div className="gene-level">
        {arrayRange(gene.level).map((i) => (
          <React.Fragment key={i}>⬥</React.Fragment>
        ))}
      </div>
    ) : null;
  const reproducer = gene.getStaticProperties().isReproductive;
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
            reproducer,
            provider: cost < 0,
          })}
        >
          <div className="gene-header">
            <GeneCost cost={cost} />
            <h4>
              {gd.blueprint.name} {geneLevelEl}
            </h4>
            {energyUpkeepEl}
          </div>

          <div className="description">{gd.blueprint.description(gene.getProps(), gene.getStaticProperties())}</div>
        </div>
      )}
    </Draggable>
  );
};
