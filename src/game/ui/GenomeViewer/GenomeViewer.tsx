import classNames from "classnames";
import * as React from "react";
import { FaArrowsAltV } from "react-icons/fa";
import { TiThMenu } from "react-icons/ti";
import Genome, { CellType } from "../../../core/cell/genome";
import { RealizedGene } from "../../../core/cell/realizedGene";
import { AddCellCard } from "./AddCellCard";
import { CellTypeViewer } from "./CellTypeViewer";
import "./GenomeViewer.scss";

interface DragInfo {
  gene: RealizedGene;
  cellType: CellType;
}

interface GenomeViewerState {
  dragged?: DragInfo;
  view: "small" | "expanded";
}

type GenomeViewerStateTupleType = [GenomeViewerState, React.Dispatch<React.SetStateAction<GenomeViewerState>>];
export const DraggedContext = React.createContext<GenomeViewerStateTupleType>(null!);

const GenomeViewer: React.FC<{ genome: Genome }> = ({ genome }) => {
  const tuple = React.useState<GenomeViewerState>({ view: "expanded" });
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
            <CellTypeViewer key={c.name} cellType={c} />
          ))}
          <AddCellCard genome={genome} />
        </div>
      </div>
    </DraggedContext.Provider>
  );
};

export default GenomeViewer;
