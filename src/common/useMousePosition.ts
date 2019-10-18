import React, { useContext } from "react";

export const MousePositionContext = React.createContext({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2
});

function useMousePosition() {
  return useContext(MousePositionContext);
}

export default useMousePosition;
