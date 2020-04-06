import classNames from "classnames";
import { useAppReducer } from "game/app";
import * as React from "react";
import { FaArrowsAltV } from "react-icons/fa";
import { TiThMenu } from "react-icons/ti";
import Genome from "../../../core/cell/genome";
import { AddCellCard } from "./AddCellCard";
import { CellTypeViewer } from "./CellTypeViewer";
import { DraggedContext, GenomeViewerState } from "./DragInfo";
import "./GenomeViewer.scss";

const GenomeViewer: React.FC<{ genome: Genome; editable?: boolean }> = ({ genome, editable = false }) => {
  const tuple = React.useState<GenomeViewerState>({ view: "expanded" });
  // HACK listen to app state changes for when a cell gets deleted
  useAppReducer();
  const [state, setState] = tuple;
  const handleViewSmall = React.useCallback(() => {
    setState((s) => ({ ...s, view: "small" }));
  }, [setState]);
  const handleViewExpanded = React.useCallback(() => {
    setState((s) => ({ ...s, view: "expanded" }));
  }, [setState]);

  return (
    <DraggedContext.Provider value={tuple}>
      <div className={classNames("genome-viewer", { dragging: state.dragged != null })}>
        <div className="view-switcher">
          <TiThMenu onClick={handleViewSmall} className={classNames("", { active: state.view === "small" })} />
          <FaArrowsAltV
            onClick={handleViewExpanded}
            className={classNames("", { active: state.view === "expanded" })}
          />
        </div>
        <div className="cell-types">
          {genome.cellTypes.map((c) => (
            <CellTypeViewer key={c.name} cellType={c} editable={editable} genome={genome} />
          ))}
          {editable ? <AddCellCard genome={genome} /> : null}
        </div>
      </div>
    </DraggedContext.Provider>
  );
};

export default GenomeViewer;
