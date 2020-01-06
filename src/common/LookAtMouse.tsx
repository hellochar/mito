// import useMouse from "@rooks/use-mouse";
import useBoundingclientrectRef from "@rooks/use-boundingclientrect-ref";
import classNames from "classnames";
import React from "react";
import "./LookAtMouse.scss";
import useMousePosition from "./useMousePosition";

interface LookAtMouseProps {
  displayBlock?: boolean;
  zScale?: number;
}

function LookAtMouse(props: JSX.IntrinsicElements["div"] & LookAtMouseProps) {
  const mouse = useMousePosition();
  const [ref, size] = useBoundingclientrectRef() as any;
  const { displayBlock = false, children, className, zScale = 5, ...restProps } = props;

  const z = window.innerWidth * zScale;

  const style = React.useMemo(() => {
    if (size != null) {
      const midX = size.left + size.width / 2;
      const midY = size.top + size.height / 2;

      const ox = mouse.x - midX;
      const oy = mouse.y - midY;
      // const rotY = Math.atan((ox * 2) / clientRect.width);
      // const rotX = Math.atan(-(oy * 2) / clientRect.height);

      const rotY = Math.atan((ox * 2) / z);
      const rotX = Math.atan(-(oy * 2) / z);
      const s: React.CSSProperties = {
        transform: `perspective(525px) rotateX(${rotX}rad) rotateY(${rotY}rad)`,
      };
      return s;
    } else {
      return {};
    }
  }, [mouse.x, mouse.y, size, z]);

  return (
    <div ref={ref} className={classNames("look-at-mouse", className, { "display-block": displayBlock })} {...restProps}>
      <div className="look-at-mouse-transform" style={style}>
        {children}
      </div>
    </div>
  );
}

export default LookAtMouse;
