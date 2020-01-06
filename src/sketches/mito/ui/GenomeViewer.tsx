import * as React from "react";
import { RealizedGene } from "../game/tile/chromosome";
import Genome, { CellType } from "../game/tile/genome";
import { spritesheetLoaded } from "../spritesheet";
import "./GenomeViewer.scss";
import IconCell from "./IconCell";

const GenomeViewer: React.FC<{ genome: Genome }> = ({ genome }) => {
  return (
    <div className="genome-viewer">
      <div className="cell-types">
        {genome.cellTypes.map((c) => (
          <CellTypeViewer cellType={c} />
        ))}
      </div>
    </div>
  );
};

const CellTypeViewer: React.FC<{ cellType: CellType }> = ({ cellType }) => {
  const { chromosome, geneSlots, name } = cellType;
  const handleDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (dragged != null) {
        cellType.chromosome.genes.push(dragged);
        dragged = undefined;
      }
    },
    [cellType.chromosome.genes]
  );
  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);
  return (
    <div className="cell-type">
      <div className="cell-header">
        <IconCell cellType={cellType.c} spritesheetLoaded={spritesheetLoaded} />
        <div>
          <h2>{name}</h2>
          {geneSlots - chromosome.geneSlotsUsed()} gene slots remaining
        </div>
      </div>
      <div className="chromosome" onDragOver={handleDragOver} onDrop={handleDrop}>
        {chromosome.genes.map((g) => (
          <GeneViewer gene={g} />
        ))}
      </div>
    </div>
  );
};

let dragged: RealizedGene | undefined;

const GeneViewer: React.FC<{ gene: RealizedGene }> = ({ gene }) => {
  const { gene: gd, level } = gene;
  const handleDragStart = React.useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData("mito/gene", "data");
      dragged = gene;
    },
    [gene]
  );
  return (
    <div className="gene" draggable onDragStart={handleDragStart}>
      <div className="gene-header">
        <span className="gene-cost">{gene.getCost()}</span>
        <h4>
          {gd.blueprint.name} {level + 1}
        </h4>
        <button onClick={() => gene.changeLevel(level + 1)}>+</button>
        <button onClick={() => gene.changeLevel(level - 1)}>-</button>
      </div>
      <p className="description">{gd.blueprint.description(gene.getProps())}</p>
    </div>
  );
};

export default GenomeViewer;
