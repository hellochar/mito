import React from "react";
import { CellType } from "../../../core/cell/genome";
import { RealizedGene } from "../../../core/cell/realizedGene";
interface DragInfo {
  gene: RealizedGene;
  cellType: CellType;
}
export interface GenomeViewerState {
  dragged?: DragInfo;
  view: "small" | "expanded";
}
type GenomeViewerStateTupleType = [GenomeViewerState, React.Dispatch<React.SetStateAction<GenomeViewerState>>];
export const DraggedContext = React.createContext<GenomeViewerStateTupleType>(null!);
