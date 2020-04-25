import { Species } from "core/species";
import React from "react";

export interface ViewerState {
  view: "small" | "expanded";
  editable: boolean;
  isDragging: boolean;
  species: Species;
}

export const ViewerContext = React.createContext<ViewerState>({
  view: "expanded",
  editable: false,
  isDragging: false,
  species: null!,
});
