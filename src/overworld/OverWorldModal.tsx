import React from "react";

import { CameraState } from "./OverWorldMap";
import { HexTile } from "./hexTile";
import { pixelPosition } from "./hexMath";

import "./OverWorldModal.scss";

interface OverWorldModalProps {
  camera: CameraState;
  tile: HexTile;
  children: React.ReactNode;
}

function OverWorldModal({ tile, camera, children }: OverWorldModalProps) {
  const [px, py] = pixelPosition(tile, camera);
  // this element is put in the center
  const container: React.CSSProperties = {
    left: px + camera.scale * 0.5,
    top: py,
  };
  return (
    <div className="overworld-modal" style={container}>
      <div className="overworld-modal-positioner">
        {children}
      </div>
    </div>
  );
}

export default OverWorldModal;
