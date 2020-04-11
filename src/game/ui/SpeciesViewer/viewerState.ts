import { Species } from "core/species";
import React from "react";
import { DragStart } from "react-beautiful-dnd";

export interface ViewerState {
  view: "small" | "expanded";
  editable: boolean;
  isDragging: boolean;
  species: Species;
  dragStart?: DragStart;
}

export const ViewerContext = React.createContext<ViewerState>({
  view: "expanded",
  editable: false,
  isDragging: false,
  species: null!,
});
