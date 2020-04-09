import React from "react";

export interface GenomeViewerState {
  view: "small" | "expanded";
  editable: boolean;
  isDragging: boolean;
}

export const GenomeViewerContext = React.createContext<GenomeViewerState>({
  view: "expanded",
  editable: false,
  isDragging: false,
});
