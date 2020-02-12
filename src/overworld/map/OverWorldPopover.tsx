import React from "react";
import { HexTile } from "../../core/hexTile";
import { pixelPosition } from "../hexMath";
import { CameraState } from "./OverWorldMap";
import "./OverWorldPopover.scss";

interface OverWorldPopoverProps {
  camera: CameraState;
  tile: HexTile;
  children: React.ReactNode;
}

function OverWorldPopover({ tile, camera, children }: OverWorldPopoverProps) {
  const [px, py] = pixelPosition(tile, camera);
  // this element is put in the center
  const container: React.CSSProperties = {
    left: px + camera.scale * 0.3,
    top: py,
  };
  return (
    <div className="overworld-popover" style={container}>
      <div className="overworld-popover-positioner">{children}</div>
    </div>
  );
}

export default OverWorldPopover;
