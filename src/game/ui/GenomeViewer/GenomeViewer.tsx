import classNames from "classnames";
import React from "react";
import { FaArrowsAltV } from "react-icons/fa";
import { TiThMenu } from "react-icons/ti";
import Genome from "../../../core/cell/genome";
import { AddCellCard } from "./AddCellCard";
import { CellTypeViewer } from "./CellTypeViewer";
import "./GenomeViewer.scss";
import { GenomeViewerContext } from "./genomeViewerState";

const GenomeViewer: React.FC<{ genome: Genome; editable?: boolean; isDragging?: boolean }> = ({
  genome,
  editable = false,
  isDragging = false,
}) => {
  const [view, setView] = React.useState<"small" | "expanded">("expanded");
  const contextValue = React.useMemo(() => ({ view, editable, isDragging }), [editable, isDragging, view]);
  const handleViewSmall = React.useCallback(() => {
    setView("small");
  }, []);
  const handleViewExpanded = React.useCallback(() => {
    setView("expanded");
  }, []);

  return (
    <GenomeViewerContext.Provider value={contextValue}>
      <div className={classNames("genome-viewer", { dragging: isDragging })}>
        <div className="view-switcher">
          <TiThMenu onClick={handleViewSmall} className={classNames({ active: view === "small" })} />
          <FaArrowsAltV onClick={handleViewExpanded} className={classNames({ active: view === "expanded" })} />
        </div>
        <div className="cell-types">
          {genome.cellTypes.map((c) => (
            <CellTypeViewer key={c.name} cellType={c} editable={editable} genome={genome} />
          ))}
          {editable ? <AddCellCard genome={genome} /> : null}
        </div>
      </div>
    </GenomeViewerContext.Provider>
  );
};

export default GenomeViewer;
