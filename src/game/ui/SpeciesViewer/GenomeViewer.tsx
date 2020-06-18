import React from "react";
import Genome from "../../../core/cell/genome";
import { AddCellCard } from "./AddCellCard";
import { CellTypeViewer } from "./CellTypeViewer";
import "./GenomeViewer.scss";
import { ViewerContext } from "./viewerState";

const GenomeViewer: React.FC<{ genome: Genome }> = ({ genome }) => {
  const { editable } = React.useContext(ViewerContext);
  return (
    <div className="genome-viewer">
      {genome.cellTypes.map((c, index) => (
        <CellTypeViewer key={index} cellType={c} editable={editable} genome={genome} />
      ))}
      {editable ? <AddCellCard genome={genome} /> : null}
    </div>
  );
};

export default GenomeViewer;
