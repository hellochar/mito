import useMousePosition, { MousePositionContext } from "common/useMousePosition";
import React, { memo, useEffect } from "react";

const Outer = memo(() => {
  const [event, setEvent] = React.useState<MouseEvent>();

  useEffect(() => {
    document.addEventListener("mousemove", (e) => setEvent(e));
  }, []);
  console.log("Outer render");
  return (
    <div>
      Outer
      <div>
        <MousePositionContext.Provider value={{ x: event?.clientX ?? 0, y: event?.clientY ?? 0 }}>
          <Middle />
        </MousePositionContext.Provider>
      </div>
    </div>
  );
});

const Middle = memo(() => {
  console.log("Middle render");
  return (
    <div>
      Middle
      <div>
        <Inner />
      </div>
    </div>
  );
});

const Inner = memo(() => {
  const mousePosition = useMousePosition();
  console.log("Inner render");
  return (
    <div>
      Inner: {mousePosition.x}, {mousePosition.y}
    </div>
  );
});
